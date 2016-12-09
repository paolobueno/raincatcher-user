var assert = require('assert');
var Store = require('./store');
var store;
var hrtime = process.hrtime;

var fixtures = require('./fixtures.json');
var daisyId = 'rJeXyfdrH';
var userToCreate = {
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
  var delta = [end[0] - start[0], end[1] - start[1]];
  // seconds in ms
  var s = delta[0] * 1e3;
  // nanoseconds in ms
  var ns = delta[1] * 1e-6;

  return s + ns;
}

describe('store', function() {
  beforeEach(function() {
    store = new Store('user', fixtures);
  });
  describe('#list', function() {
    it('should return all users', function(done) {
      store.list().then(function(res) {
        assert.equal(res.length, fixtures.length);
      }).then(done).catch(done);
    });
  });
  describe('#read', function() {
    it('should find an user by id', function(done) {
      store.read(daisyId).then(function(daisy) {
        assert(daisy.username === 'daisy');
      }).then(done).catch(done);
    });
    it('should not allow edits', function(done) {
      store.read(daisyId).then(function(daisy) {
        daisy.username = 'donald duck';
      }).then(function() {
        return store.read(daisyId).then(function(daisy2) {
          assert.equal(daisy2.username, 'daisy',
            'username should not have been edited');
        });
      }).then(done).catch(done);
    });
    it('should error when not found', function(done) {
      store.read('invalid_id').then(function(user) {
        assert(!user);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#byUsername', function() {
    it('should find an user by username', function(done) {
      store.byUsername('daisy').then(function(daisy) {
        assert(daisy.username === 'daisy');
      }).then(done).catch(done);
    });
    it('should not allow edits', function(done) {
      store.byUsername('daisy').then(function(daisy) {
        daisy.username = 'donald duck';
      }).then(function() {
        return store.byUsername('daisy');
      }).then(function(daisy2) {
        assert(daisy2);
      }).then(done).catch(done);
    });
    it('should error when not found', function(done) {
      store.byUsername('invalid_username').then(function(user) {
        assert(!user);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#create', function() {
    it('should add a new user [slow]', function(done) {
      var oldCount;
      store.list().then(function(orig) {
        oldCount = orig.length;
        return store.create(userToCreate);
      }).then(function() {
        return store.list();
      }).then(function(newUsers) {
        assert.equal(newUsers.length, oldCount + 1,
          'total users should have increased by 1');
      }).then(done).catch(done);
    });
    it('should generate an id [slow]', function(done) {
      store.create(userToCreate).then(function(user) {
        assert(user.id);
      }).then(done).catch(done);
    });
  });
  describe('#update', function() {
    it('should update fields', function(done) {
      store.update(daisyId, {position: 'test'}).then(function(newDaisy) {
        assert.equal(newDaisy.username, 'daisy');
        assert.equal(newDaisy.position, 'test');
      }).then(done).catch(done);
    });
    it('should error when not found', function(done) {
      store.update('invalid_id', {position:'test'}).then(function(user) {
        assert(!user);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
  });
  describe('#verifyPassword', function() {
    beforeEach(function(done) {
      store.create(userToCreate).then(function() {
        done();
      });
    });
    it('should error when not found', function(done) {
      store.verifyPassword('invalidusername', userToCreate.password).then(function(match) {
        assert(!match);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
    it('should return true on correct password [slow]', function(done) {
      store.verifyPassword(userToCreate.username, userToCreate.password).then(function(match) {
        assert(match);
      }).then(done).catch(done);
    });
    it('should increment password retry count when no match [slow]', function(done) {
      store.verifyPassword(userToCreate.username, 'nope').catch(function() {
        return store.byUsername(userToCreate.username);
      }).then(function(user) {
        assert(user.passwordAttempts, 1);
      }).then(done).catch(done);
    });
    it('should reset password retry count when match [slow]', function(done) {
      store.verifyPassword(userToCreate.username, userToCreate.password).then(function(match) {
        assert(match);
      }).then(function() {
        return store.byUsername(userToCreate.username);
      }).then(function(user) {
        assert.equal(user.passwordAttempts, 0);
      }).then(done).catch(done);
    });
    it('should have an increasing delay on failed attempts [slow]', function(done) {
      this.timeout(5000);
      var end1, end2;
      var start = hrtime();
      store.verifyPassword(userToCreate.username, 'nope').catch(function() {
        return store.verifyPassword(userToCreate.username, 'nope');
      }).catch(function() {
        end1 = hrtime();
        assert(hrtimeDiff(start, end1) > 500,
          'should have waited at least 500ms for second attempt');
        return store.verifyPassword(userToCreate.username, 'nope');
      }).catch(function() {
        end2 = hrtime();
        assert(hrtimeDiff(end1, end2) > 1000,
          'should have waited at least 1s for third attempt');
      }).then(done);
    });
  });
  describe('#updatePassword', function() {
    beforeEach(function(done) {
      store.create(userToCreate).then(function() {
        done();
      });
    });
    it('should error when user not found', function(done) {
      store.updatePassword('invalid_username', 'old', 'new').then(function(user) {
        assert(!user);
      }).then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
    it('should error when old password is not correct [slow]', function(done) {
      store.updatePassword(userToCreate.username, 'nope', 'new').then(done).catch(function(err) {
        assert(err);
        done();
      });
    });
    it('should update the password when the old one is provided [slow]', function(done) {
      store.updatePassword(userToCreate.username, userToCreate.password, 'new').then(function() {
        return store.verifyPassword(userToCreate.username, 'new');
      }).then(function(match) {
        assert(match);
      }).then(function() {
        return store.byUsername(userToCreate.username);
      }).then(function(user) {
        assert(!user.passwordAttempts);
      }).then(done).catch(done);
    });
  });
  describe('#delete', function() {
    it('should remove a user', function(done) {
      store.delete(daisyId).then(function(user) {
        assert.equal(user.username, 'daisy');
      }).then(done).catch(done);
    });
    it('should return null when user not found', function(done) {
      store.delete('invalid_username').then(function(user) {
        assert.equal(user, null);
      }).then(done).catch(done);
    });
  });
});
