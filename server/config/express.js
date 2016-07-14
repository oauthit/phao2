/*jslint node: true */
'use strict';

var config = require('./config/index');
var express = require('express');
var passport = require('passport');
var site = require('./site');
var oauth2 = require('./oauth2');
var token = require('./token');
var http = require('http');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var expressSession = require("express-session");
var path = require('path');

//Pull in the mongo store if we're configured to use it
//else pull in MemoryStore for the session configuration
var sessionStorage;
if (config.session.type === 'MongoStore') {
  var MongoStore = require('connect-mongo')({session: expressSession});
  console.log('Using MongoDB for the Session');
  sessionStorage = new MongoStore({
    db: config.session.dbName
  });
} else if (config.session.type === 'MemoryStore') {
  var MemoryStore = expressSession.MemoryStore;
  console.log('Using MemoryStore for the Session');
  sessionStorage = new MemoryStore();
} else {
  //We have no idea here
  throw new Error("Within config/index.js the session.type is unknown: " + config.session.type);
}

//Pull in the mongo store if we're configured to use it
//else pull in MemoryStore for the database configuration
var db = require('../' + config.db.type);
if (config.db.type === 'mongodb') {
  console.log('Using MongoDB for the data store');
} else if (config.db.type === 'db') {
  console.log('Using MemoryStore for the data store');
} else {
  //We have no idea here
  throw new Error("Within config/index.js the db.type is unknown: " + config.db.type);
}

// Express configuration
var app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());

//Session Configuration
app.use(expressSession({
  saveUninitialized: true,
  resave: true,
  secret: config.session.secret,
  store: sessionStorage,
  key: "authorization.sid",
  cookie: {maxAge: config.session.maxAge}
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
require('./auth');

//static resources for stylesheets, images, javascript files
app.use(express.static(path.join(__dirname, 'public')));

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
