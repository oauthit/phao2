/*jslint node: true */
'use strict';

var config = require('./config/index');
var express = require('express');
var http = require('http');
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


// Passport configuration
require('./auth');
var app = express();
require('./config/express')(app);

//From time to time we need to clean up any expired tokens
//in the database
setInterval(function () {
  db.accessTokens.removeExpired(function (err) {
    if (err) {
      console.error("Error removing expired tokens");
    }
  });
}, config.db.timeToCheckExpiredTokens * 1000);

// Start server
function startServer() {
  http.createServer(app).listen(3000, function () {
    console.log("OAuth 2.0 Authorization Server started on port 3000");
  });
}

setImmediate(startServer);

// Expose app
export default app;
