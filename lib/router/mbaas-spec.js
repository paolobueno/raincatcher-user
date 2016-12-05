const assert = require('assert');
const mbaasRouter = require('./mbaas');
const express = require('express');
const supertest = require('supertest');
const bodyParser = require('body-parser');
const mediatorMock = require('./mocks/mediatorMock');
const sampleUser = require('./fixtures/user');


describe('mbaas', function() {

  describe('Test mbass authentication', function() {
    var app, request;


    beforeEach(function() {
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
          assert.ok(res);
          assert.equal(res.body.status, 'ok');
          assert.equal(res.body.userId, sampleUser.username);
          assert.deepEqual(res.body.authResponse, sampleUser);
          done();
        });
    });

    it('Should get 404 User not found when logging in with incorrect username', function(done) {
      request
        .get('/api/wfm/user/auth')
        .send({userId: 'invalid_username', password: sampleUser.password})
        .expect(404, function(err, res) {
          assert.ok(!err, 'Error on invalid username ' + err);
          assert.ok(res);
          assert.equal(res.body, 'User not found');
          done();
        });
    });

    it('Should get 401 Invalid credentials when logging in with incorrect password', function(done) {
      request
        .get('/api/wfm/user/auth')
        .send({userId: sampleUser.username, password: 'invalid_password'})
        .expect(401, function(err, res) {
          assert.ok(!err, 'Error on invalid password ' + err);
          assert.ok(res);
          assert.equal(res.body, 'Invalid credentials for ' + sampleUser.username);
          done();
        });
    });
  });

});