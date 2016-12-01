var sinon = require('sinon');
require('sinon-as-promised');
var sampleUser = require('../fixtures/user');

/**
 * This function builds sinon stub to define mediator.request() behaviour.
 *
 * Example usage:
 * mediator.request('wfm:example:topic', parameter), (returns Promise)
 * stub.withArgs('wfm:example:topic', {parameter(sinon.match)}).resolves( {return value} )
 * stub.withArgs('wfm:example:topic', {parameter(sinon.match)}).rejects( {error})
 *
 * @returns {stub} mediator stub
 */
function getRequestStub() {
  var stub = sinon.stub();

  // valid credentials auth stub
  stub.withArgs('wfm:user:auth', {username: sampleUser.username, password: sampleUser.password}).resolves(true);

  // invalid username auth stub
  stub.withArgs('wfm:user:auth',
    sinon.match({
      username: sinon.match(function(username) {
        return username !== sampleUser.username;
      }),
      password: sinon.match(sampleUser.password)
    })).rejects(new Error());


  // invalid password auth stub
  stub.withArgs('wfm:user:auth',
    sinon.match({
      username: sinon.match(sampleUser.username),
      password: sinon.match(function(password) {
        return password !== sampleUser.password;
      })
    })).rejects(new Error());

  //valid username read stub
  stub.withArgs('wfm:user:username:read', sampleUser.username)
    .resolves(sampleUser);

  // invalid username read stub
  stub.withArgs('wfm:user:username:read',
    sinon.match(function(username) {
      return username !== sampleUser.username;
    })).rejects(new Error());

  return stub;
}


module.exports = {
  request: getRequestStub()
};