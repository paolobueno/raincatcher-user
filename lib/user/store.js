const _ = require('lodash');
const shortid = require('shortid');
const hash = require('./hash');
const ATTEMPT_DELAY_MS = 500;
const verifyErrMessage = 'User not found with supplied credentials';

function findById(id) {
  return _.find(this.data, {id: id});
}
function findByUsername(username) {
  return _.find(this.data, {username: username});
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

Store.prototype.all = function(cb) {
  return cb(null, _.map(this.data, cloneAndCleanup));
};

Store.prototype.read = function(id, cb) {
  const user = findById(id);
  if (!user) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(user));
};

Store.prototype.byUsername = function(username, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(user));
};


Store.prototype.create = function(user, cb) {
  user = _.clone(user);
  user.id = shortid.generate();
  setUserPassword(user, user.password, function(err, user) {
    if (err) {
      return cb(err);
    }
    this.data.push(user);
    cb(null, cloneAndCleanup(user));
  });
};

Store.prototype.update = function(id, user, cb) {
  const originalUser = findById(id);
  // avoid updating the password and id on this method
  delete user.id;
  delete user.password;
  _.assign(originalUser, user);
  if (!originalUser) {
    return cb(new Error('User not found'));
  }
  cb(null, cloneAndCleanup(originalUser));
};

Store.prototype.updatePassword = function(username, oldPwd, newPwd, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error(verifyErrMessage));
  }
  hash.verify(oldPwd, user.password, function(err, match) {
    if (err || !match) {
      return cb(new Error(verifyErrMessage));
    }
    setUserPassword(user, newPwd, function(err, user) {
      if (err) {
        return cb(new Error(verifyErrMessage));
      }
      cb(null, cloneAndCleanup(user));
    });
  });
};

function calculateDelay(attempts) {
  return (Math.pow(2, attempts) - 1) * ATTEMPT_DELAY_MS;
}

function doVerify(password, user, cb) {
  // user.password here should be the stored hash
  hash.verify(password, user.password, function(err, match) {
    if (err) {
      return cb(err);
    }
    if (!match) {
      user.passwordAttempts = user.passwordAttempts || 0;
      user.passwordAttempts++;
      cb(new Error(verifyErrMessage), false);
    } else {
      user.passwordAttempts = 0;
      cb(null, true);
    }
  });
}

Store.prototype.verifyPassword = function(username, password, cb) {
  const user = findByUsername(username);
  if (!user) {
    return cb(new Error(verifyErrMessage));
  }
  const delay = calculateDelay(user.passwordAttempts);
  if (delay > 0) {
    setTimeout(doVerify.bind(null, password, user, cb), delay);
  } else {
    doVerify(password, user, cb);
  }
};

Store.prototype.delete = function(id, cb) {
  const removed = _.remove(this.data, {id: id});
  if (!removed.length) {
    return cb(new Error('User not found'));
  }
  cb(null, removed[0]);
};

module.exports = Store;