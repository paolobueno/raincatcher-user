const q = require('q');

/**
 * Auth sends a request on 'wfm:user:auth' topic, raincatcher-demo-auth is subscriber
 * of this topic and verifies passed in credentials.
 *
 * @param {Object} mediator object used to subscribe and publish read and auth topics
 * @param {String} username Unique identifier of the user.
 * @param {String} password passed in password to be verified against user.
 *
 */
exports.auth = function(mediator, username, password) {

  /**
   * Returns promise with user profile for authenticated user, or an error
   * if user doesn't exist or is not authenticated.
   *
   * @param {boolean} authenticated
   * @returns {*|promise} containing user profile for authenticated user.
   */
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
  // this will return true/false result of verification or User not found error
  return mediator.request('wfm:user:auth', {username: username, password: password}, {uid: username})
    .then(checkAuthentication);
};
