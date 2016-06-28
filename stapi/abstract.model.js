'use strict';
var request = require('request');
var _ = require('lodash');
var debug = require('debug')('oauth2orize:abstract.model');
var uuid = require('node-uuid');
var config = require('../config');

function model(name) {

  var collectionUrl = config.stapi.url + name;

  return function (req) {

    function find(options) {
      return new Promise(function (resolve, reject) {

        var url = collectionUrl;

        if (typeof options === 'string') {
          url += '/' + options;
          options = undefined;
        }

        //debug ('find', options);

        request({
          url: url,
          qs: options && options.params || options,
          json: true,
          //headers: {
          //  authorization: req && req.headers.authorization
          //}
        }, function (err, res, body) {

          //debug ('find',body);
          if (err) {
            return reject(err);
          }

          if (!body) {
            return resolve([]);
          }

          try {
            resolve(body.length ? body : [body]);
          } catch (err) {
            reject(err);
          }

        });

      });
    }

    function findOne(options) {
      //debug ('findOne',options);
      return new Promise(function (resolve, reject) {

        find(options).then(function (reply) {
          reply && reply.length && resolve(reply[0]) || resolve(false);
        }, reject);

      });
    }

    function save(body) {
      return new Promise(function (resolve, reject) {

        request.post({
          url: collectionUrl,
          //headers: {
          //  authorization: req && req.headers.authorization
          //},
          json: body
        }, function (err, res, json) {
          debug(res.statusCode, json);
          var e = err || res.statusCode !== 200 && json;
          if (e) {
            e = res.statusCode !== 201 && json;
          }
          debug('save', e);
          e && reject(e) || resolve(json);
        });

      });
    }

    function getOrCreate(params, data) {

      return new Promise(function (resolve, reject) {
        findOne(params).then(function (body) {

          if (body) {
            resolve(body, 'get');
          } else {
            save(_.defaults(data, params, {id: uuid.v4()})).then(resolve, reject);
          }

        }, reject);
      });

    }

    function findById(id) {
      return findOne(id);
    }

    function deleteById(id) {
      return new Promise(function (resolve, reject) {

        var url = collectionUrl + '/' + id;

        request.del({
          url: url,
          //headers: {
          //  authorization: req && req.headers.authorization
          //}
        }, function (err, res, body) {
          if (err) {
            return reject(err);
          }

          resolve(body);
        });

      });
    }

    function update(id, body) {
      return new Promise(function (resolve, reject) {

        var url = collectionUrl + '/' + id;

        request.put({
          url: url,
          json: body,
          //headers: {
          //  authorization: req && req.headers.authorization
          //}
        }, function (err, res, body) {
          if (err) {
            return reject(err);
          }

          resolve(body);
        });

      });
    }

    function patch(id, body) {

      return new Promise(function (resolve, reject) {
        var url = collectionUrl + '/' + id;

        //debug ('patch authorization:',req.headers);

        request.patch({
          url: url,
          json: body,
          //headers: {
          //  authorization: req && req.headers.authorization
          //}
        }, function (err, res, body) {
          if (err) {
            return reject(err);
          }

          resolve(body);
        });
      });

    }

    return {
      find: find,
      findOne: findOne,
      findById: findById,
      save: save,
      update: update,
      patch: patch,
      getOrCreate: getOrCreate,
      deleteById: deleteById
    };
  };


}

module.exports = model;
