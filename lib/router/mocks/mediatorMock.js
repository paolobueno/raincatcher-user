const q = require('q');
const sampleUser = require('../fixtures/user');

module.exports = {
  //eslint-disable-next-line no-unused-vars
  request: function(topic, args, options) {
    switch (topic) {
      case 'wfm:user:auth':
        return auth(args);
      case 'wfm:user:username:read':
        return read(args);
    }
  }
};

function auth(args) {
  const authDeferred = q.defer();
  if (args.username === sampleUser.username) {
    if (args.password === sampleUser.password) {
      authDeferred.resolve(true);
    } else {
      authDeferred.resolve(false);
    }
  } else {
    authDeferred.reject(new Error('User not found'));
  }
  return authDeferred.promise;
}


function read(args) {
  const readDeferred = q.defer();
  if (args === sampleUser.username) {
    readDeferred.resolve(sampleUser);
  } else {
    readDeferred.reject(new Error('User not found'));
  }
  return readDeferred.promise;
}
