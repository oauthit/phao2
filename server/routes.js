'use strict';

/**
 * Main application routes
 */

const user = require('./controllers/user');
const client = require('./controllers/client');
const token = require('./controllers/token');
const site = require('./controllers/site');

import oauth2 from './oauth2';
import errors from './components/errors';

export default routes;

function routes (app) {

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
  app.get('/api/tokeninfo', token.info);

  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
    .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(errors[404]);
}
