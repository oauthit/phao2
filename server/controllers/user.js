/*jslint node: true */
/*global exports */
'use strict';

const passport = require('passport');

exports.info = [
  passport.authenticate('bearer', {session: false}),
  function (req, res) {
    res.json({
      id: req.user.id,
      name: req.user.name,
      displayName: req.user.name,
      mobileNumber: req.user.mobileNumber
    });
  }
];
