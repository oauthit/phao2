/*jslint node: true */
'use strict';

/**
 * Module dependencies.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');
var login = require('connect-ensure-login');
var config = require('../config/index');
var utils = require('../utils');
var debug = require('debug')('oauth2orize:authorization-server/oauth2');
var stapi = require('../stapi/abstract.model.js');
var AccessToken = stapi('accessToken');
var RefreshToken = stapi('refreshToken');
var AuthCode = stapi('authCode');
var Client = stapi('client');

// create OAuth 2.0 server
var server = oauth2orize.createServer();

// Register supported grant types.
//
// OAuth 2.0 specifies a framework that allows users to grant client
// applications limited access to their protected resources.  It does this
// through a process of the user granting access, and the client exchanging
// the grant for an access token.

/**
 * Grant authorization codes
 *
 * The callback takes the `client` requesting authorization, the `redirectURI`
 * (which is used as a verifier in the subsequent exchange), the authenticated
 * `user` granting access, and their response, which contains approved scope,
 * duration, etc. as parsed by the application.  The application issues a code,
 * which is bound to these values, and will be exchanged for an access token.
 */
server.grant(oauth2orize.grant.code(function (client, redirectURI, user, ares, done) {
  var code = utils.uid(config.token.authorizationCodeLength);
  debug('grant code:', client, user, ares);
  AuthCode().save({
      code: code,
      clientId: client.id,
      accountId: user.id,
      redirectURI: redirectURI,
      //TODO: add scope column to client
      scope: client.scope || 'somescope'
    })
    .then(function () {
      return done(null, code);
    })
    .catch(function (err) {
      debug('authorization code save:', err);
      return done(err);
    });
}));


/**
 * Exchange authorization codes for access tokens.
 *
 * The callback accepts the `client`, which is exchanging `code` and any
 * `redirectURI` from the authorization request for verification.  If these values
 * are validated, the application issues an access token on behalf of the user who
 * authorized the code.
 */
server.exchange(oauth2orize.exchange.code(function (client, code, redirectURI, done) {
  debug('exchange code:', client, code, redirectURI);
  AuthCode().findOne({
    params: {
      code: code,
      isUsed: false
    }
  }).then(function (authCode) {
    debug('authCode:', authCode);
    if (!authCode) {
      return done(null, false);
    }
    if (client.id !== authCode.clientId) {
      return done(null, false);
    }
    if (redirectURI !== authCode.redirectURI) {
      return done(null, false);
    }
    //TODO maybe delete by code?
    AuthCode().patch(authCode.id, {isUsed: true})
      .then(function (result) {

        debug('deleteById result:', result);
        if (result !== undefined && result === 0) {
          //This condition can result because of a 'race condition' that can occur naturally when you're making
          //two very fast calls to the authorization server to exchange authorization codes.  So, we check for
          // the result and if it's not undefined and the result is zero, then we have already deleted the
          // authorization code
          return done(null, false);
        }
        var token = utils.uid(config.token.accessTokenLength);

        //TODO save scope for access token?
        AccessToken().save({
          code: token,
          accountId: authCode.accountId,
          clientId: authCode.clientId,
          expirationDate: config.token.calculateExpirationDate(),
          authCodeId: authCode.id
        }).then(function (accessToken) {
          var refreshToken = null;
          //I mimic openid connect's offline scope to determine if we send
          //a refresh token or not

          //TODO: for now without scope and refresh tokens :(
          if (authCode.scope && authCode.scope.indexOf('offline_access') === 0) {

            refreshToken = utils.uid(config.token.refreshTokenLength);

            RefreshToken().save({
              code: refreshToken,
              accountId: authCode.accountId,
              clientId: authCode.clientId,
              authCodeId: authCode.id
            }, function (err) {
              if (err) {
                return done(err);
              }
              return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
            });

          } else {
            return done(null, token, refreshToken, {expires_in: config.token.expiresIn});
          }
        }).catch(function (err) {
          debug('accessToken save:', err);
          return done(err);
        });

      })
      .catch(function (err) {
        debug('authorization code deleteById:', err);
        return done(err);
      });
  }).catch(function (err) {
    debug('authorization code find one:', err);
    return done(err);
  });
}))
;

/**
 * User authorization endpoint
 *
 * `authorization` middleware accepts a `validate` callback which is
 * responsible for validating the client making the authorization request.  In
 * doing so, is recommended that the `redirectURI` be checked against a
 * registered value, although security requirements may vary accross
 * implementations.  Once validated, the `done` callback must be invoked with
 * a `client` instance, as well as the `redirectURI` to which the user will be
 * redirected after an authorization decision is obtained.
 *
 * This middleware simply initializes a new authorization transaction.  It is
 * the application's responsibility to authenticate the user and render a dialog
 * to obtain their approval (displaying details about the client requesting
 * authorization).  We accomplish that here by routing through `ensureLoggedIn()`
 * first, and rendering the `dialog` view.
 */
exports.authorization = [
  login.ensureLoggedIn(),
  function (req, res, next) {
    console.log('session:', req.session);
    next();
  },
  server.authorization(function (clientID, redirectURI, scope, done) {
    debug('server.authorization:', clientID, redirectURI, scope);
    console.log('server.authorization:', clientID, redirectURI, scope);
    Client().findById(clientID)
      .then(function (client) {
        debug('client:', client);

        if (client) {
          client.scope = scope;
        }
        // WARNING: For security purposes, it is highly advisable to check that
        //          redirectURI provided by the client matches one registered with
        //          the server.  For simplicity, this example does not.  You have
        //          been warned.
        return done(null, client, redirectURI);
      })
      .catch(function (err) {
        debug('server.authorization err:', err);
        return done(err);
      })
    ;
  }),
  function (req, res, next) {
    //Render the decision dialog if the client isn't a trusted client
    //TODO Make a mechanism so that if this isn't a trusted client, the user can recorded that they have consented
    //but also make a mechanism so that if the user revokes access to any of the clients then they will have to
    //re-consent.
    debug('authorization callback req.query.client_id:', req.query.client_id);
    Client().findById(req.query.client_id)
      .then(function (client) {
        if (client && client.isTrusted && client.isTrusted === true) {
          //This is how we short call the decision like the dialog below does
          server.decision({loadTransaction: false}, function (req, callback) {
            callback(null, {allow: true});
          })(req, res, next);
        } else {
          res.render('dialog', {transactionID: req.oauth2.transactionID, user: req.user, client: req.oauth2.client});
        }
      })
      .catch(function () {
        res.render('dialog', {
          transactionID: req.oauth2.transactionID,
          user: req.user,
          client: req.oauth2.client
        });
      })
    ;
  }
]
;

/**
 * User decision endpoint
 *
 * `decision` middleware processes a user's decision to allow or deny access
 * requested by a client application.  Based on the grant type requested by the
 * client, the above grant middleware configured above will be invoked to send
 * a response.
 */
exports.decision = [
  login.ensureLoggedIn(),
  function (req, res, next) {
    debug('ensureLoggedIn req.session:', req.session);
    next();
  },
  server.decision()
];

/**
 * Token endpoint
 *
 * `token` middleware handles client requests to exchange authorization grants
 * for access tokens.  Based on the grant type being exchanged, the above
 * exchange middleware will be invoked to handle the request.  Clients must
 * authenticate when making requests to this endpoint.
 */
exports.token = [
  passport.authenticate(['oauth2-client-password'], {session: false}),
  server.token(),
  server.errorHandler()
];

// Register serialialization and deserialization functions.
//
// When a client redirects a user to user authorization endpoint, an
// authorization transaction is initiated.  To complete the transaction, the
// user must authenticate and approve the authorization request.  Because this
// may involve multiple HTTPS request/response exchanges, the transaction is
// stored in the session.
//
// An application must supply serialization functions, which determine how the
// client object is serialized into the session.  Typically this will be a
// simple matter of serializing the client's ID, and deserializing by finding
// the client by ID from the database.

server.serializeClient(function (client, done) {
  debug('serializeClient:', client);
  return done(null, client.id);
});

server.deserializeClient(function (id, done) {
  debug('deserializeClient:', id);
  Client().findById(id)
    .then(function (client) {
      return done(null, client);
    })
    .catch(function (err) {
      debug('deserializeClient catch:', err);
      return done(err);
    });
});

