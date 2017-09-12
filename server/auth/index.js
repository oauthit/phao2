/*jslint node: true */
'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
const BearerStrategy = require('passport-http-bearer').Strategy;
const debug = require('debug')('oauth2orize:authorization-server/auth');
const stapi = require('../stapi/abstract.model.js');
const Account = stapi('account');
const Login = stapi('login');
const Client = stapi('client');
const AccessToken = stapi('accessToken');

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

    debug('LocalStrategy code:', code, 'loginId:', loginId);

    return Login().findById(loginId)
      .then(login => {

        debug('login:', login, code);

        if (login.attempts > 3) {
          return done(null, false, {
            text: 'SMS code expired'
          });
        }

        if (code !== login.code) {

          Login().patch(loginId, {
            attempts: ++ login.attempts
          });

          return done(null, false, {
            text: 'Wrong SMS code'
          });
        }

        Account().findById(login.accountId)
          .then(account => {
            debug('account:', account);
            if (!account) return done(null, false);

            return done(null, account);
          })
          .catch(err => {
            debug('error:', err);
            return done(err);
          });

      })
      .catch(err => {
        debug('error:', err);
        return done(err);
      });
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
        debug('token:', token);
        if (token.accountId !== null) {
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
            })
          ;
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
