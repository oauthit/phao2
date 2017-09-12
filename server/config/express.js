/*jslint node: true */
'use strict';

const config = require('../config/index');
const express = require('express');
const passport = require('passport');

// internalization
const i18n = require('i18n');

i18n.configure({
  locales: ['en', 'ru', 'lt'],
  defaultLocale: config.LANGUAGE,
  directory: __dirname + '/locales',
  register: global
});

// application wide locale
i18n.setLocale(config.language);

const bodyParser = require('body-parser');
const expressSession = require('express-session');
const path = require('path');

export default function (app) {

  let sessionStorage;

  if (config.session.type === 'MemoryStore') {

    const MemoryStore = expressSession.MemoryStore;

    console.log('Using MemoryStore for the Session');
    sessionStorage = new MemoryStore();

  } else if (config.session.type === 'RedisStore') {

    const RedisStore = require('connect-redis')(expressSession);
    const redisConfig = config.redis;
    console.log('Using RedisStore for the Session');
    sessionStorage = new RedisStore(redisConfig);

  } else {
    //We have no idea here
    throw new Error('Within config/index.js the session.type is unknown: ' + config.session.type);
  }


// Express configuration

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

  // app.use(i18n.init);

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
