'use strict';

var express = require('express');
var config = require('../user/config-user');
var userAuth = require('./mbaas-auth');

function initRouter(mediator) {
  var router = express.Router();

  router.all('/auth', function(req, res) {
    var params = req.body;
    var userId = params && params.userId || params.username;
    if (userId) {

      // try to authenticate
      userAuth.auth(mediator, userId, params.password)
        .then(function(profileData) {
          // on success pass relevant data into response
          res.status = 200;
          res.json({
            status: 'ok',
            userId: userId,
            sessionToken: userId + '_sessiontoken',
            authResponse: profileData
          });
        })
        .catch(function(err) {
          // on error pass error message into response body, assign 401 http code.
          // 401 - invalid credentials (unauthorised)
          res.status(401);
          res.json(err.message ? err.message : 'Invalid Credentials');
        });
    } else {
      console.log('No username provided');
      res.status(400);
      res.json({message: 'Invalid credentials'});
    }
  })
  ;

  router.all('/verifysession', function(req, res) {
    res.json({
      isValid: true
    });
  });

  router.all('/revokesession', function(req, res) {
    res.json({});
  });

  router.route('/').get(function(req, res) {
    mediator.once('done:wfm:user:list', function(data) {
      res.json(data);
    });
    mediator.publish('wfm:user:list');
  });
  router.route('/:id').get(function(req, res) {
    var userId = req.params.id;
    mediator.once('done:wfm:user:read:' + userId, function(data) {
      res.json(data);
    });
    mediator.publish('wfm:user:read', userId);
  });
  router.route('/:id').put(function(req, res) {
    var userId = req.params.id;
    var user = req.body.user;
    mediator.once('done:wfm:user:update:' + userId, function(saveduser) {
      res.json(saveduser);
    });
    mediator.publish('wfm:user:update', user);
  });
  router.route('/').post(function(req, res) {
    var ts = new Date().getTime();  // TODO: replace this with a proper uniqe (eg. a cuid)
    var user = req.body.user;
    user.createdTs = ts;
    mediator.once('done:wfm:user:create:' + ts, function(createduser) {
      res.json(createduser);
    });
    mediator.publish('wfm:user:create', user);
  });
  router.route('/:id').delete(function(req, res) {
    var userId = req.params.id;
    var user = req.body.user;
    mediator.once('done:wfm:user:delete:' + userId, function(deleted) {
      res.json(deleted);
    });
    mediator.publish('wfm:user:delete', user);
  });


  return router;
}

module.exports = function(mediator, app) {
  var router = initRouter(mediator);
  app.use(config.apiPath, router);
};
