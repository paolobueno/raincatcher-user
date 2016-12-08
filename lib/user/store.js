const _ = require('lodash');
const shortid = require('shortid');
const hash = require('./hash');
const ATTEMPT_DELAY_MS = 500;
const verifyErrMessage = 'User not found with supplied credentials';
const q = require('q');
q.longStackSupport = process.env.NODE_ENV === 'development';

function findById(id, data) {
  return _.find(data, {id: id});
}
function findByUsername(username, data) {
  return _.find(data, {username: username});
}

function cloneAndCleanup(user) {
  const cloned = _.clone(user);
  delete cloned.password;
  return cloned;
}

function setUserPassword(user, pwd, cb) {
  hash.saltAndHash(pwd, function(err, hashed) {
    if (err) {
      return cb(err);
    }
    user.password = hashed;
    user.passwordAttempts = 0;
    cb(null, user);
  });
}

function Store(datasetId, data) {
  this.data = data;
}

/**
 * Helper function to reset underlying collection for testing
 */
Store.prototype.setAll = function(arr) {
  this.data = arr;
};

Store.prototype.all = function() {
  return q(_.map(this.data, cloneAndCleanup));
};

Store.prototype.read = function(id) {
  const user = findById(id, this.data);
  if (!user) {
    return q.reject(new Error('User not found'));
  }
  return q(cloneAndCleanup(user));
};

Store.prototype.byUsername = function(username) {
  const user = findByUsername(username, this.data);
  if (!user) {
    return q.reject(new Error('User not found'));
  }
  return q(cloneAndCleanup(user));
};


Store.prototype.create = function(user) {
  user = _.clone(user);
  user.id = shortid.generate();
  var self = this;
  return q.nfcall(setUserPassword, user, user.password).then(function(user) {
    self.data.push(user);
    return cloneAndCleanup(user);
  });
};

Store.prototype.update = function(id, user) {
  const originalUser = findById(id, this.data);
  // avoid updating the password and id on this method
  delete user.id;
  delete user.password;
  _.assign(originalUser, user);
  if (!originalUser) {
    return q.reject(new Error('User not found'));
  }
  return q(cloneAndCleanup(originalUser));
};

Store.prototype.updatePassword = function(username, oldPwd, newPwd) {
  const user = findByUsername(username, this.data);
  if (!user) {
    return q.reject(new Error(verifyErrMessage));
  }
  return q.nfcall(hash.verify, oldPwd, user.password).then(function(match) {
    if (!match) {
      throw new Error();
    }
    return q.nfcall(setUserPassword, user, newPwd);
  }).then(function(user) {
    return cloneAndCleanup(user);
  }).catch(function() {
    return q.reject(new Error(verifyErrMessage));
  });
};

function calculateDelay(attempts) {
  return (Math.pow(2, attempts) - 1) * ATTEMPT_DELAY_MS;
}

function doVerify(password, user) {
  // user.password here should be the stored hash
  return q.nfcall(hash.verify, password, user.password).then(function(match) {
    if (!match) {
      user.passwordAttempts = user.passwordAttempts || 0;
      user.passwordAttempts++;
      throw new Error(verifyErrMessage);
    } else {
      user.passwordAttempts = 0;
      return true;
    }
  });
}

Store.prototype.verifyPassword = function(username, password) {
  const user = findByUsername(username, this.data);
  if (!user) {
    return q.reject(new Error(verifyErrMessage));
  }
  const delay = calculateDelay(user.passwordAttempts);
  if (delay > 0) {
    return q.delay(delay).then(function() {
      return doVerify(password, user);
    });
  } else {
    return doVerify(password, user);
  }
};

Store.prototype.delete = function(id) {
  const removed = _.remove(this.data, {id: id});
  if (!removed.length) {
    return q.reject(new Error('User not found'));
  }
  return q(removed[0]);
};

module.exports = Store;