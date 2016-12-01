const q = require('q');


/**
 * Returns promise with user profile for authenticated user, or an error
 * if user doesn't exist or is not authenticated.
 *
 * @param {boolean} authenticated
 * @returns {*|promise} containing user profile for authenticated user.
 */
function checkAuthentication(authenticated, mediator, userIdentifier) {
  if (authenticated) {
    console.log('authenticated');
    return mediator.request('wfm:user:username:read', userIdentifier);
  }
  var checkAuthDeferred = q.defer();
  console.log('Invalid Credentials');
  checkAuthDeferred.reject(new Error('Invalid Credentials'));
  return checkAuthDeferred.promise;
}

/**
 * Auth sends a request on 'wfm:user:auth' topic, raincatcher-demo-auth is subscriber
 * of this topic and verifies passed in credentials.
 *
 * @param {Object} mediator object used to subscribe and publish read and auth topics
 * @param {String} userIdentifier Unique identifier of the user.
 * @param {String} password passed in password to be verified against user.
 * @returns {Promise} user profile if resolved or error when invalid credentials were provided.
 */
exports.auth = function(mediator, userIdentifier, password) {
  console.log('Checking credentials for user');
  // this will return true/false result of verification or User not found error
  return mediator.request('wfm:user:auth', {username: userIdentifier, password: password}, {uid: userIdentifier})
    .then(function(authenticated) {
      return checkAuthentication(authenticated, mediator, userIdentifier);
    });
};
