const assert = require('assert');
const mbaasRouter = require('./mbaas');
const express = require('express');
const supertest = require('supertest');
const bodyParser = require('body-parser');
const mediatorMock = require('./mocks/mediatorMock');
const sampleUser = require('./fixtures/user');
const sinon = require('sinon');

describe('Test mbass authentication', function() {
  var app, request;


  beforeEach(function() {
    mediatorMock.request.reset();
    app = express();
    app.use(bodyParser.json());
    mbaasRouter(mediatorMock, app);
    request = supertest(app);

  });

  it('Should log in using correct credentials', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUser.username, password: sampleUser.password})
      .expect(200, function(err, res) {
        assert.ok(!err, 'Error on valid credentials ' + err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body.status, 'ok', "Expected status ok from the successful authentication request.");
        assert.equal(res.body.userId, sampleUser.username, "Expected user profile from the successful authentication request.");
        assert.deepEqual(res.body.authResponse, sampleUser, "User profile in authResponse was expected to equal sampleUser.");
        sinon.assert.calledTwice(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth', {username: sampleUser.username, password: sampleUser.password});
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:username:read', sampleUser.username);
        done();
      });
  });

  it('Should get 401 User not found when logging in with incorrect username', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: 'invalid_username', password: sampleUser.password})
      .expect(401, function(err, res) {
        assert.ok(!err, 'Error on invalid username ' + err);
        assert.ok(res, "Expected a result from the failed authentication request.");
        assert.equal(res.body, 'Invalid Credentials', 'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(function(username) {
              return username !== sampleUser.username;
            }),
            password: sinon.match(sampleUser.password)
          }));
        done();
      });
  });

  it('Should get 401 Invalid credentials when logging in with incorrect password', function(done) {
    request
      .get('/api/wfm/user/auth')
      .send({userId: sampleUser.username, password: 'invalid_password'})
      .expect(401, function(err, res) {
        assert.ok(!err, 'Error on invalid password ' + err);
        assert.ok(res, "Expected a result from the authentication request.");
        assert.equal(res.body, 'Invalid Credentials', 'Expected Invalid credentials message in response body on unsuccessful authentication request.');
        sinon.assert.calledOnce(mediatorMock.request);
        sinon.assert.calledWith(mediatorMock.request, 'wfm:user:auth',
          sinon.match({
            username: sinon.match(sampleUser.username),
            password: sinon.match(function(password) {
              return password !== sampleUser.password;
            })
          }));

        done();
      });
  });
});