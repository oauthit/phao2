/*jslint node: true */
/*global exports console*/
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
var debug = require('debug')('oauth2orize:controller:site');
var i18n = require('i18n');

exports.index = function (req, res, next) {
  res.redirect('account');
};

exports.registerForm = function (req, res) {
  return res.render('register');
};

exports.loginForm = function (req, res) {

  console.log('loginForm session:', req.session);

  // TODO find where returnTo is defined
  if (!req.session.returnTo) {
    req.session.returnTo = '/account';
  }
  var url_parts = url.parse(req.session.returnTo, true);
  var query = url_parts.query;

  return res.render('login', {clientId: query.client_id});

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
  const testerRe = /authcode=([\d]+)/;

  let tester = testerRe.test(account.info);

  let login = {
    smsCode: smsCode,
    expiresAt: expiresAt,
    accountId: account.id
  };

  if (tester) {
    login.smsCode = account.info.match(testerRe)[1];
    return saveLogin(req, res, login);
  }

  return sendSms(req, smsCode)
    .then((response) => {
      debug('sms success', response);
      // TODO add smsResponse to Login table
      login.smsResponse = response;
      return saveLogin(req, res, login);
    })
    .catch((err) => {
      debug('sms error', err);
      return res.render('error', {text: 'Error sending SMS'});
    });
}


exports.mobileNumberProcessForm = function (req, res) {

  console.log('loginForm session:', req.session);
  console.log('mobileNumberProcessForm body:', req.body);

  let mobileNumber = req.body.mobileNumber;

  if (!mobileNumber) {
    return res.render('login', {
      error: 'Mobile Number is required'
    });
  }

  mobileNumber = mobileNumber.replace(/[^\d]/g,'');
  console.log(mobileNumber);

  return Account(req).findOne({
    mobileNumber: mobileNumber
  })
    .then(function (account) {
      console.log(account);

      if (account) {
        return accountLogin(req, res, account);
      } else {

        //TODO for now just error that mobileNumber incorrect
        // return res.render('error', {text: `The number ${mobileNumber} is not registered`});
        return res.render('register', {mobileNumber: req.body.mobileNumber});
      }

    }).catch(function (err) {
      console.log(err);
      return res.sendStatus(503);
    });
};


exports.registerProcessForm = function (req, res) {
  //create account
  //then login

  let {mobileNumber, firstName, lastName} = req.body;
  let error;

  if (!mobileNumber) {
    error = 'Mobile Number is required';
  } else if (!firstName) {
    error = 'Fisrt Name is required';
  } else if (!lastName) {
    error = 'Last Name is required';
  }

  if (error) {
    return res.render('register', {
      error,
      mobileNumber,
      lastName,
      firstName
    });
  }

  mobileNumber = mobileNumber.replace(/[^\d]/g,'');

  Account(req).find({
    mobileNumber: mobileNumber
  }).then((response) => {
    console.log('find account by mobileNumber:', response);
    if (response && response.length > 0) {
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
        name: `${lastName} ${firstName}`,
        mobileNumber: mobileNumber,
        isConfirmed: false
      }).then((account) => {
        console.log('registerProcessForm account:', account);
        console.log(account);
        return accountLogin(req, res, account).then((response) => {
          console.log(response);
          res.render('confirm', {
            mobileNumber: mobileNumber,
            mobileNumberId: response.accountId,
            loginId: response.id
          });
        });
      }).catch((err) => {

        console.error(err);

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

exports.confirmSms = function(req, res, next) {

  passport.authenticate('local', {badRequestMessage: 'SMS code is required'}, function (err, user, errInfo) {

    if (err) {
      debug ('confirmSms err', err);
      return next(err);
    }

    if (!user) {
      debug ('confirmSms !user', errInfo);
      return res.render('confirm', {
        mobileNumber: req.body.mobileNumber,
        mobileNumberId: req.body.mobileNumberId,
        loginId: req.body.loginId,
        error: errInfo.text || errInfo.message
      });
    }

    req.logIn(user,{successReturnToOrRedirect: '/', failureRedirect: '/login'},function(err) {
      debug('confirmSms req.logIn error', err);
      if (err) {
        return next(err);
      } else {
        let nextUrl = '/account';

        // set isConfirmed to true
        Account(req).patch(req.body.mobileNumberId, {
          isConfirmed: true
        });

        if (req.session && req.session.returnTo) {
          nextUrl = req.session.returnTo;
          delete req.session.returnTo;
        }
        debug ('confirmSms', nextUrl);
        return res.redirect(nextUrl);
      }
    });

  })(req, res, next);

};


exports.logout = function (req, res) {
  req.logout();
  res.redirect('/');
};


exports.account = [
  login.ensureLoggedIn('login'),
  function (req, res) {
    res.render('account', {user: req.user});
  }
];
