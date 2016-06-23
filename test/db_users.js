/*jslint node: true */
/*global it */
/*global describe */
'use strict';

var assert = require("assert");
var config = require('../config');
var dbTokens = require('../' + config.db.type);
var uuid = require('node-uuid');

describe('find user', function () {

  var userId = '6a2655b2-f12c-11e3-8000-e86e56d4dd5b';
  it('should find user by id', function (done) {
    dbTokens.users.find(userId, function (err, user) {
      assert.equal(err, null);
      console.log(user);
      done();
    })
  });
});
