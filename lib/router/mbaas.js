'use strict';

var express = require('express')
  , config = require('../user/config-user')
  ;

function initRouter(mediator) {
  var router = express.Router();

  router.all('/auth', function(req, res) {
    var params = req.body; // params.userId params.password
    if (params && (params.userId || params.username)) {
      var username = params.userId || params.username;
      console.log('Checking credentials for user ' + username);
      mediator.request('wfm:user:username:read', username)
      .then(function(profileData) {
        console.log('Valid credentials for user ' + username);
        res.json({
          status: 'ok',
          userId: username,
          sessionToken: username + '_sessiontoken',
          authResponse: profileData
        });
      }, function() {
        console.log('Invalid credentials for user ' + username);
        res.status(400);
        res.json({message: 'Invalid credentials'});
      });
    } else {
      console.log('No username provided');
      res.status(400);
      res.json({message: 'Invalid credentials'});
    }
  });

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
