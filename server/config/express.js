/*jslint node: true */
'use strict';

var config = require('../config/index');
var express = require('express');
var passport = require('passport');

var http = require('http');
var bodyParser = require('body-parser');
//var cookieParser = require('cookie-parser');
var fs = require('fs');
var expressSession = require('express-session');
var path = require('path');

export default function (app) {

  var sessionStorage;

  if (config.session.type === 'MemoryStore') {

    var MemoryStore = expressSession.MemoryStore;

    console.log('Using MemoryStore for the Session');
    sessionStorage = new MemoryStore();

  } else if (config.session.type === 'RedisStore') {

    var RedisStore = require('connect-redis')(expressSession);
    var redisConfig = config.redis;
    console.log('Using RedisStore for the Session');
    sessionStorage = new RedisStore(redisConfig);

  } else {
    //We have no idea here
    throw new Error('Within config/index.js the session.type is unknown: ' + config.session.type);
  }


// Express configuration
  var env = app.get('env');
  config.root = path.normalize(__dirname + '/../..');

  app.set('views', config.root + '/server/views');
  app.set('view engine', 'pug');

//  app.use(cookieParser());
//Session Configuration
  app.use(expressSession({
    saveUninitialized: false,
    resave: false,
    secret: config.session.secret,
    store: sessionStorage,
    key: 'pha.sid',
    cookie: {maxAge: config.session.maxAge}
  }));

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(passport.initialize());
  app.use(passport.session());

// Passport configuration
  require('../auth');

  app.use(express.static(path.join(config.root, 'server/public')));


// Catch all for error messages.  Instead of a stack
// trace, this will log the json of the error message
// to the browser and pass along the status with it
  app.use(function (err, req, res, next) {
    if (err) {
      res.status(err.status);
      res.json(err);
    } else {
      next();
    }
  });

}
