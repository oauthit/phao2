/*jslint node: true */
/*global exports */
'use strict';

//TODO Document all of this

var passport = require('passport');
var login = require('connect-ensure-login');
var rp = require('request-promise');
var config = require('./../config/index');
var querystring = require('querystring');
var url = require('url');
var stapi = require('./../stapi/abstract.model.js');
var Login = stapi('login');
var Account = stapi('account');
var debug = require('debug')('site');

exports.index = function (req, res) {
  if (!req.query.code) {
    res.render('index');
  } else {
    res.render('index-with-code');
  }
};


exports.registerForm = function (req, res) {
  return res.render('register');
};

exports.loginForm = function (req, res) {

  console.log('loginForm session:', req.session);

  // TODO find where returnTo is defined
  if (req.session.returnTo) {
    var url_parts = url.parse(req.session.returnTo, true);
    var query = url_parts.query;

    return res.render('login', {clientId: query.client_id});
  } else {
    return res.render('error', {text: 'returnTo undefined'});
  }

};

function sendSms(req, smsCode) {
  let options = {
    method: 'POST',
    uri: config.smsTrafficAPI.uri,
    form: {
      login: config.smsTrafficAPI.login,
      password: config.smsTrafficAPI.password,
      originator: config.smsTrafficAPI.originator,
      message: smsCode,
      rus: 5,
      phones: req.body.mobileNumber
    },
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  };

  return rp(options);
}

function saveLogin(req, res, login) {
  console.log('login:', login);

  return Login(req).save({
    code: login.smsCode,
    expiresAt: login.expiresAt,
    attempts: 0,
    clientId: req.body.clientId,
    accountId: login.accountId
  })
    .then(function (response) {
      console.log('response:', response);
      return res.render('confirm', {
        mobileNumber: req.body.mobileNumber,
        mobileNumberId: login.accountId,
        loginId: response.id
      });
    })
    .catch(function (err) {
      console.log(err);
      return res.sendStatus(500);
    });
}

function accountLogin(req, res, account) {
  //generate sms code
  const smsCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
  const expiresAt = new Date(Date.now() + 60 * 1000 * 5);

  let tester = /authcode=/g.test(account.info);

  let login = {
    smsCode: smsCode,
    expiresAt: expiresAt,
    accountId: account.id
  };

  if (tester) {
    return saveLogin(req, res, login);
  }

  return sendSms(req, smsCode)
    .then((response) => {
      console.log('Got sms!!!', response);
      return Account(req).update(login.accountId, {
        info: 'authcode=' + smsCode
      }).then((response) => {
        console.log('response:', response);
        return saveLogin(req, res, login);
      }).catch(err => {
        return res.render('error', {error: err});
      });
    })
    .catch((err) => {
      debug('sms sending err:', err);
    });
}

//TODO refactor this controller it is too bloated
exports.mobileNumberProcessForm = function (req, res) {
  console.log('loginForm session:', req.session);
  console.log('mobileNumberProcessForm body:', req.body);

  let mobileNumber = req.body.mobileNumber;

  if (!mobileNumber) {
    return res.render('login', {
      error: 'Mobile Number is required'
    });
  }

  return Account(req).findOne({
    mobileNumber: mobileNumber
  })
    .then(function (account) {
      console.log(account);

      if (account) {
        return accountLogin(req, res, account);
      } else {
        //TODO for now just error that mobileNumber incorrect
        return res.render('error', {text: `The number ${mobileNumber} is not registered`});
        // return res.render('register', {mobileNumber: req.body.mobileNumber});
      }

    }).catch(function (err) {
      console.log(err);
      return res.send(500);
    });
};

exports.registerProcessForm = function (req, res) {
  //create account
  //then login

  Account(req).find({
    mobileNumber: req.body.mobileNumber
  }).then((response) => {
    console.log('find account by mobileNumber:', response);
    if (response) {
      let account = response[0];
      console.log('registerProcessForm account:', account);
      return accountLogin(req, res, account).then((response) => {
        console.log(response);
        res.render('confirm', {
          mobileNumber: req.body.mobileNumber,
          mobileNumberId: response.accountId,
          loginId: response.id
        });
      });
    } else {
      Account(req).save({
        name: req.body.name,
        mobileNumber: req.body.mobileNumber
      }).then((account) => {
        console.log('registerProcessForm account:', account);
        console.log(account);
        return accountLogin(req, res, account).then((response) => {
          console.log(response);
          res.render('confirm', {
            mobileNumber: req.body.mobileNumber,
            mobileNumberId: response.accountId,
            loginId: response.id
          });
        });
      }).catch((err) => {
        // TODO: report an error
        console.error(err);
        //res.sendStatus(500);

        if (err.text) {
          return res.render('register', {
            mobileNumber: req.body.mobileNumber,
            name: req.body.name,
            error: err.text
          });
        }

      });
    }
  }).catch((err) => {
    console.error(err);
    res.sendStatus(500);
  });

};

exports.confirmSms = [
  passport.authenticate('local', {successReturnToOrRedirect: '/', failureRedirect: '/login'})
];

exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};

exports.account = [
  login.ensureLoggedIn(),
  function (req, res) {
    res.render('account', {user: req.user});
  }
];
