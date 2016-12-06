'use strict';

const express = require('express');
const config = require('../user/config-user');
const userAuth = require('./mbaas-auth');
var _ = require('lodash');
var session = require('express-session');
var connectMongo = require('connect-mongo');


function initRouter(mediator, sessionStore, expressSessionConfig) {
  var router = express.Router();

  if (_.isFunction(sessionStore)) {
    // param is the action sessionStore for the session
    router.sessionStore = sessionStore(session);
  } else if (_.isObject(sessionStore)) {
    // param is config object for default sessionStore which is connect-mongo
    var MongoStore = connectMongo(session);
    router.sessionStore = new MongoStore(sessionStore);
  }
  // don't allow store to be overwritten since it needs to be defined here
  delete expressSessionConfig.store;
  router.expressSessionConfig = _.defaults(expressSessionConfig, {
    secret: process.env.FH_COOKIE_SECRET || 'raincatcher',
    store: router.sessionStore,
    resave: false,
    cookie: {
      secure: process.env.NODE_ENV !== 'development'
    }
  });

  router.all('/auth', function(req, res) {
    var params = req.body; // params.userId params.password
    if (params && (params.userId || params.username)) {
      var username = params.userId || params.username;

      // try to authenticate
      userAuth.auth(mediator, username, params.password)
        .then(function(profileData) {
          // on success pass relevant data into response
          res.status = 200;
          res.json({
            status: 'ok',
            userId: username,
            sessionToken: username + '_sessiontoken',
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
      return res.json({message: 'Invalid credentials'});
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
  app.use(session(router.expressSessionConfig));
  app.use(config.apiPath, router);
};
