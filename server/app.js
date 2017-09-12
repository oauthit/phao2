/*jslint node: true */
'use strict';

const config = require('./config/index');
const express = require('express');
const http = require('http');

import debug from 'debug';
debug.log = console.info.bind(console);


// Passport configuration
require('./auth');

// Express configuration
const app = express();
require('./config/express')(app);

import routes from './routes';

routes(app);

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
