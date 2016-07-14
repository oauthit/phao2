/*jslint node: true */
'use strict';

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var debug = require('debug')('oauth2orize:authorization-server/auth');
var stapi = require('../stapi/abstract.model.js');
var Account = stapi('account');
var Login = stapi('login');
var Client = stapi('client');
var AccessToken = stapi('accessToken');

/**
 * LocalStrategy
 *
 * This strategy is used to authenticate users based on a username and password.
 * Anytime a request is made to authorize an application, we must ensure that
 * a user is logged in before asking them to approve the request.
 */
passport.use(new LocalStrategy({
    usernameField: 'loginId',
    passwordField: 'code'
  },
  function (loginId, code, done) {
    debug('code, loginId:', code, loginId);

    // TODO: find login by id, validate code, get account by login.accountId, return account

    return Login().findById(loginId)
      .then(function (login) {
        debug('login:', login, code);
        if (code !== login.code) {
          return done(null, false);
        }
        Account().findById(login.accountId)
          .then(function (account) {
            debug('account:', account);
            if (!account) return done(null, false);

            //console.log(JSON.parse(account));
            return done(null, account);
          })
          .catch(function (err) {
            debug('error:', err);
            return done(err);
          })
        ;

      })
      .catch(function (err) {
        debug('error:', err);
        return done(err);
      })
      ;
  }
));

/**
 * BasicStrategy & ClientPasswordStrategy
 *
 * These strategies are used to authenticate registered OAuth clients.  They are
 * employed to protect the `token` endpoint, which consumers use to obtain
 * access tokens.  The OAuth 2.0 specification suggests that clients use the
 * HTTP Basic scheme to authenticate.  Use of the client password strategy
 * allows clients to send the same credentials in the request body (as opposed
 * to the `Authorization` header).  While this approach is not recommended by
 * the specification, in practice it is quite common.
 */
passport.use(new BasicStrategy(
  function (username, password, done) {
    debug('basicStrategy:', username, password);
    Client().findById(username)
      .then(function (client) {
        if (!client) {
          return done(null, false);
        }
        if (client.clientSecret !== password) {
          return done(null, false);
        }
        return done(null, client);
      })
      .catch(function (err) {
        return done(err);
      })
    ;
  }
));

/**
 * Client Password strategy
 *
 * The OAuth 2.0 client password authentication strategy authenticates clients
 * using a client ID and client secret. The strategy requires a verify callback,
 * which accepts those credentials and calls done providing a client.
 */
passport.use(new ClientPasswordStrategy(
  function (clientId, clientSecret, done) {
    debug('ClientPasswordStrategy:', clientId, clientSecret);
    Client().findById(clientId)
      .then(function (client) {
        if (!client) {
          debug('client:', client, clientSecret);
          return done(null, false);
        }
        if (client.clientSecret !== clientSecret) {
          debug('client:', client, clientSecret);
          return done(null, false);
        }
        return done(null, client);
      })
      .catch(function (err) {
        debug('find client:', err);
        return done(err);
      })
    ;
  }
));

/**
 * BearerStrategy
 *
 * This strategy is used to authenticate either users or clients based on an access token
 * (aka a bearer token).  If a user, they must have previously authorized a client
 * application, which is issued an access token to make requests on behalf of
 * the authorizing user.
 */
passport.use(new BearerStrategy(
  function (accessToken, done) {
    debug('bearerStrategy:accessToken:', accessToken);
    AccessToken().findOne({
      code: accessToken
    }).then(function (token) {

      if (!token) {
        return done(null, false);
      }
      if (new Date() > token.expirationDate) {
        AccessToken().deleteById(token.id)
          .catch(function (err) {
            return done(err);
          });
      } else {
        if (token.userID !== null) {
          Account().findById(token.accountId)
            .then(function (user) {

              if (!user) {
                return done(null, false);
              }
              // to keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes
              var info = {scope: '*'};
              return done(null, user, info);
            })
            .catch(function (err) {
              debug('account findById error:', err);
              return done(err);
            });
        } else {
          //The request came from a client only since userID is null
          //therefore the client is passed back instead of a user
          Client().findById(token.clientId)
            .then(function (client) {

              if (!client) {
                return done(null, false);
              }
              // to keep this example simple, restricted scopes are not implemented,
              // and this is just for illustrative purposes
              var info = {scope: '*'};
              return done(null, client, info);
            })
            .catch(function (err) {
              debug('client findById error:', err);
              return done(err);
            });
        }
      }
    }).catch(function (err) {
      debug('accessToken find error:', err);
      return done(err);
    });
  }
));

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

passport.serializeUser(function (user, done) {
  debug('serializeUser:user', user.id);
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  Account().findById(id).then(function (user) {
      debug('deserializedUser', id, user);
      done(null, user);
    })
    .catch(function (err) {
      debug('deserialize err:', err);
      done(err);
    });
});
