const _ = require('lodash');
const shortid = require('shortid');
const hash = require('./hash');
const ArrayStore = require('fh-wfm-mediator/lib/array-store');
const q = require('q');
q.longStackSupport = process.env.NODE_ENV === 'development';

const ATTEMPT_DELAY_MS = 500;
const verifyErrMessage = 'User not found with supplied credentials';

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
  this.topic = {};
  this.subscription = {};
  this.datasetId = datasetId;
}

/**
 * Helper function to reset underlying collection for testing
 */
Store.prototype.setAll = function(arr) {
  this.data = arr;
};

Store.prototype.list = ArrayStore.prototype.list;

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
  }
  return doVerify(password, user);
};

Store.prototype.delete = ArrayStore.prototype.delete;

Store.prototype.listen = function(topicPrefix, mediator) {
  var self = this;
  ArrayStore.prototype.listen.apply(this, arguments);
  // subscribe to extra topics
  self.topic.usernameLoad = 'wfm:user:username:read';
  console.log('Subscribing to mediator topic:', self.topic.usernameLoad);
  self.subscription.usernameLoad = mediator.subscribe(self.topic.usernameLoad, function(username) {
    self.byUsername(username).then(function(user) {
      mediator.publish('done:' + self.topic.usernameLoad + ':' + username, user);
    }).catch(function(err) {
      mediator.publish('error:' + self.topic.usernameLoad + ':' + username, err);
    });
  });
  self.topic.auth = 'wfm:user:auth';
  console.log('Subscribing to mediator topic:', self.topic.auth);
  self.subscription.auth = mediator.subscribe(self.topic.auth, function(data) {
    self.verifyPassword(data.username, data.password).then(function(passwordCorrect) {
      mediator.publish('done:' + self.topic.auth + ':' + data.username, passwordCorrect);
    }).catch(function(err) {
      mediator.publish('error:' + self.topic.auth + ':' + data.username, err.message);
    });
  });
  self.topic.passwordEdit = 'wfm:user:password';
  console.log('Subscribing to mediator topic:', self.topic.passwordEdit);
  self.subscription.passwordEdit = mediator.subscribe(self.topic.passwordEdit, function(data) {
    self.updatePassword(data.username, data.oldPwd, data.newPwd).then(function(user) {
      mediator.publish('done:' + self.topic.passwordEdit + ':' + data.username, user);
    }).catch(function(err) {
      mediator.publish('error:' + self.topic.passwordEdit + ':' + data.username, err.message);
    });
  });
};

Store.prototype.unsubscribe = function() {
  ArrayStore.prototype.unsubscribe.apply(this, arguments);
  // unsubscribe extra topics
  this.mediator.remove(this.topic.usernameLoad, this.subscription.usernameLoad.id);
  this.mediator.remove(this.topic.auth, this.subscription.auth.id);
  this.mediator.remove(this.topic.passwordEdit, this.subscription.passwordEdit.id);
};

module.exports = Store;