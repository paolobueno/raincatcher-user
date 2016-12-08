const assert = require('assert');
const Store = require('./store');
var store;
const hrtime = require('process').hrtime;

const fixtures = require('./fixtures.json');
const daisyId = 'rJeXyfdrH';
const userToCreate = {
  "username" : "jdoe",
  "name" : "John Doe",
  "position" : "Truck Inspector",
  "phone" : "(265) 754 8176",
  "email" : "jdoe@wfm.com",
  "avatar" : "https://s3.amazonaws.com/uifaces/faces/twitter/madysondesigns/128.jpg",
  "password" : "Password1"
};

/**
 * Outputs difference between two process.hrtime() in ms
 */
function hrtimeDiff(start, end) {
  const delta = [end[0] - start[0], end[1] - start[1]];
  // seconds in ms
  const s = delta[0] * 1e3;
  // nanoseconds in ms
  const ns = delta[1] * 1e-6;

  return s + ns;
}

describe('store', function() {
  beforeEach(function() {
    store = new Store('user', fixtures);
  });
  describe('#all', function() {
    it('should return all users', function(done) {
      store.all(function(err, res) {
        assert(!err);
        assert.equal(res.length, fixtures.length);
        done();
      });
    });
  });
  describe('#read', function() {
    it('should find an user by id', function(done) {
      store.read(daisyId, function(err, daisy) {
        assert(!err);
        assert(daisy.username === 'daisy');
        done();
      });
    });
    it('should not allow edits', function(done) {
      store.read(daisyId, function(err, daisy) {
        assert(!err);
        daisy.username = 'donald duck';
        store.read(daisyId, function(err, daisy2) {
          assert(!err);
          assert.equal(daisy2.username, 'daisy',
            'username should not have been edited');
          done();
        });
      });
    });
    it('should error when not found', function(done) {
      store.read('invalid_id', function(err, user) {
        assert(err);
        assert(!user);
        done();
      });
    });
  });
  describe('#byUsername', function() {
    it('should find an user by username', function(done) {
      store.byUsername('daisy', function(err, daisy) {
        assert(!err);
        assert(daisy.username === 'daisy');
        done();
      });
    });
    it('should not allow edits', function(done) {
      store.byUsername('daisy', function(err, daisy) {
        assert(!err);
        daisy.username = 'donald duck';
        store.byUsername('daisy', function(err, daisy2) {
          assert(!err);
          assert(daisy2);
          done();
        });
      });
    });
    it('should error when not found', function(done) {
      store.byUsername('invalid_username', function(err, user) {
        assert(err);
        assert(!user);
        done();
      });
    });
  });
  describe('#create', function() {
    it('should add a new user [slow]', function(done) {
      var oldCount;
      store.all(function(err, orig) {
        assert(!err);
        oldCount = orig.length;
        store.create(userToCreate, function(err) {
          assert(!err),
          store.all(function(err, newUsers) {
            assert(!err);
            assert.equal(newUsers.length, oldCount + 1,
              'total users should have increased by 1');
            done();
          });
        });
      });
    });
    it('should generate an id [slow]', function(done) {
      store.create(userToCreate, function(err, user) {
        assert(!err);
        assert(user.id);
        done();
      });
    });
  });
  describe('#update', function() {
    it('should update fields', function(done) {
      store.update(daisyId, {position: 'test'}, function(err, newDaisy) {
        assert(!err);
        assert.equal(newDaisy.username, 'daisy');
        assert.equal(newDaisy.position, 'test');
        done();
      });
    });
    it('should error when not found', function(done) {
      store.update('invalid_id', {position:'test'}, function(err, user) {
        assert(err);
        assert(!user);
        done();
      });
    });
  });
  describe('#verifyPassword', function() {
    beforeEach(function(done) {
      var self = this;
      store.create(userToCreate, function(err, user) {
        self.user = user;
        done();
      });
    });
    it('should error when not found', function(done) {
      store.verifyPassword('invalidusername', userToCreate.password, function(err, match) {
        assert(err);
        assert(!match);
        done();
      });
    });
    it('should return true on correct password [slow]', function(done) {
      store.verifyPassword(userToCreate.username, userToCreate.password, function(err, match) {
        assert(!err);
        assert(match);
        done();
      });
    });
    it('should increment password retry count when no match [slow]', function(done) {
      store.verifyPassword(userToCreate.username, 'nope', function(err, match) {
        assert(err);
        assert(!match);
        store.byUsername(userToCreate.username, function(err, user) {
          assert(!err);
          assert(user.passwordAttempts, 1);
          done();
        });
      });
    });
    it('should reset password retry count when match [slow]', function(done) {
      store.verifyPassword(userToCreate.username, userToCreate.password, function(err, match) {
        assert(!err);
        assert(match);
        store.byUsername(userToCreate.username, function(err, user) {
          assert(!err);
          assert(!user.passwordAttempts);
          done();
        });
      });
    });
    it('should have an increasing delay on failed attempts [slow]', function(done) {
      this.timeout(5000);
      const start = hrtime();
      store.verifyPassword(userToCreate.username, 'nope', function(err, match) {
        assert(err);
        assert(!match);
        store.verifyPassword(userToCreate.username, 'nope', function(err, match) {
          assert(err);
          assert(!match);
          const end1 = hrtime();
          assert(hrtimeDiff(start, end1) > 500,
            'should have waited at least 500ms for second attempt');
          store.verifyPassword(userToCreate.username, 'nope', function(err, match) {
            assert(err);
            assert(!match);
            const end2 = hrtime();
            assert(hrtimeDiff(end1, end2) > 1000,
              'should have waited at least 1s for third attempt');
            done();
          });
        });
      });
    });
  });
  describe('#updatePassword', function() {
    beforeEach(function(done) {
      var self = this;
      store.create(userToCreate, function(err, user) {
        self.user = user;
        done();
      });
    });
    it('should error when user not found', function(done) {
      store.updatePassword('invalid_username', 'old', 'new', function(err, user) {
        assert(err);
        assert(!user);
        done();
      });
    });
    it('should error when old password is not correct [slow]', function(done) {
      store.updatePassword(userToCreate.username, 'nope', 'new', function(err) {
        assert(err);
        done();
      });
    });
    it('should update the password when the old one is provided [slow]', function(done) {
      store.updatePassword(userToCreate.username, userToCreate.password, 'new', function(err) {
        assert(!err, err);
        store.verifyPassword(userToCreate.username, 'new', function(err, match) {
          assert(!err);
          assert(match);
          store.byUsername(userToCreate.username, function(err, user) {
            assert(!err);
            assert(!user.passwordAttempts);
            done();
          });
        });
      });
    });
  });
  describe('#delete', function() {
    it('should remove a user', function(done) {
      store.delete(daisyId, function(err, user) {
        assert(!err, err);
        assert.equal(user.username, 'daisy');
        done();
      });
    });
    it('should error when user not found', function(done) {
      store.delete('invalid_username', function(err, user) {
        assert(err);
        assert(!user);
        done();
      });
    });
  });
});
