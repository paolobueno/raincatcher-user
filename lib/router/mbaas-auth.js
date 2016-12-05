const q = require('q');

/**
 * @param {Object} mediator object used to subscribe and publish read and auth topics
 * @param {String} username Unique identifier of the user.
 * @param {String} password passed in password to be verified against user.
 *
 */
exports.auth = function(mediator, username, password) {

  function checkAuthentication(authenticated) {
    var checkAuthDeferred = q.defer();
    if (authenticated) {
      console.log(username, ' authenticated');
      return mediator.request('wfm:user:username:read', username);
    } else {
      console.log('Invalid credentials for ', username);
      const error = new Error('Invalid credentials for ' + username);
      error.http_code = 401;
      checkAuthDeferred.reject(error);
      return checkAuthDeferred.promise;
    }
  }

  console.log('Checking credentials for user ' + username);

  return mediator.request('wfm:user:auth', {username: username, password: password}, {uid: username})
    .then(checkAuthentication);
};
