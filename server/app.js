/*jslint node: true */
'use strict';

var config = require('./config/index');
var express = require('express');
var http = require('http');
var fs = require('fs');


// Passport configuration
require('./auth');

// Express configuration
var app = express();
require('./config/express')(app);
require('./routes')(app);

//From time to time we need to clean up any expired tokens
//in the database
// setInterval(function () {
//   db.accessTokens.removeExpired(function (err) {
//     if (err) {
//       console.error("Error removing expired tokens");
//     }
//   });
// }, config.db.timeToCheckExpiredTokens * 1000);

// Start server
function startServer() {
  http.createServer(app).listen(config.express.port, function () {
    console.log("OAuth 2.0 Authorization Server started on port ", config.express.port);
  });
}

setImmediate(startServer);

// Expose app
export default app;
