/*jslint node: true */
/*global it */
/*global describe */
'use strict';

var assert = require("assert");
var config = require('../config');
var dbTokens = require('../' + config.db.type);
var uuid = require('node-uuid');

describe('find user', function () {

  it('should find user by id', function (done) {
    dbTokens.users.find(userId, function (err, user) {
      assert.equal(err, null);
      console.log(user);
      done();
    })
  });
});
