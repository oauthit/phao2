/**
 * Main application routes
 */

var user = require('./controllers/user');
var client = require('./controllers/client');
var token = require('./controllers/token');
var site = require('./controllers/site');
var oauth2 = require('./oauth2');

'use strict';

import errors from './components/errors';
import path from 'path';

export default function(app) {
  // Insert routes below
  app.get('/', site.index);
  app.get('/login', site.loginForm);
  app.post('/mobileNumberProcessForm', site.mobileNumberProcessForm);
  app.post('/confirmSms', site.confirmSms);

  app.get('/register', site.registerForm);
  app.post('/registerProcessForm', site.registerProcessForm);
  app.get('/logout', site.logout);
  app.get('/account', site.account);

  app.get('/dialog/authorize', oauth2.authorization);
  app.post('/dialog/authorize/decision', oauth2.decision);
  app.post('/oauth/token', oauth2.token);

  app.get('/api/userinfo', user.info);
  app.get('/api/clientinfo', client.info);

// Mimicking google's token info endpoint from
// https://developers.google.com/accounts/docs/OAuth2UserAgent#validatetoken
  app.get('/api/tokeninfo', token.info);

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get((req, res) => {
      console.log('all others!');
      res.sendFile(path.resolve(app.get('appPath') + '/index.html'));
    });
}
