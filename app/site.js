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

exports.index = function (req, res) {
  if (!req.query.code) {
    res.render('index');
  } else {
    res.render('index-with-code');
  }
};

exports.loginForm = function (req, res) {
  console.log(req.session);
  var url_parts = url.parse(req.session.returnTo, true);
  var query = url_parts.query;

  res.render('login', {clientId: query.client_id});
};

exports.mobileNumberProcessForm = function (req, res) {
  console.log(req.body);

  //generate sms code
  const smsCode = Math.floor(Math.random() * (9999 - 1000) + 1000);
  const expiresAt = new Date(Date.now() + 60*1000*5);

  return Account(req).findOne({
      mobileNumber: req.body.mobileNumber
    })
    .then(function (account) {
      return Login(req).save({
          code: smsCode,
          expiresAt: expiresAt,
          attempts: 0,
          clientId: req.body.clientId,
          accountId: account.id
        })
        .then(function (response) {
          console.log('response:', response);
          return res.render('confirm', {mobileNumber: req.body.mobileNumber, mobileNumberId: account.id, loginId: response.id});
        })
        .catch(function (err) {
          console.log(err);
          return res.sendStatus(500);
        });

    }).catch(function (err) {
      console.log(err);
      return res.sendStatus(500);
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
