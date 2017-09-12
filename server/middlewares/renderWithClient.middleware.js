'use strict';

const stapi = require('./../stapi/abstract.model');
const url = require('url');
const Client = stapi('client');

module.exports = function (viewName, params) {
  return function (req, res, next) {

    const url_parts = url.parse(req.session.returnTo, true);
    const query = url_parts.query;

    if (query.client_id || req.body.clientId) {

      if (query.client_id) {
        Client(req).findById(query.client_id)
          .then(client => {
            console.log(query.client_id);
            console.log('find client by query.client_id');
            return res.render(viewName, Object.assign(params, {clientId: query.client_id}, {client}));
          })
          .catch(err => {
            return res.render('error', err);
          })
        ;
      } else if (req.body.clientId) {
        Client(req).findById(req.body.clientId)
          .then(client => {
            console.log('find client by req.body.clientId');
            return res.render(viewName, Object.assign(params, {client}));
          })
          .catch(err => {
            return res.render('error', err);
          });
      }
    } else {
      console.log('next called...');
      next();
    }

  };
};
