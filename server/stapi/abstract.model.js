'use strict';
const request = require('request');
const _ = require('lodash');
const debug = require('debug')('oauth2orize:abstract.model');
const uuid = require('node-uuid');
const config = require('../config/index');

function model(name) {

  const collectionUrl = config.stapi.url + name;

  return function () {

    function find(options) {
      return new Promise(function (resolve, reject) {

        let url = collectionUrl;

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

          if (err) {
            return reject(err);
          }

          if (/5[\d]{2}/.test(res.statusCode)) {
            return reject (body);
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
          const data = reply && reply.length && reply[0] || false;
          resolve(data);
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
          debug('save', res.statusCode, json);
          let e = err;

          if (!e && [200,201].indexOf(res.statusCode) < 0) {
            e = json || `Error saving "${name}"`;
          }

          return e ? reject(e) : resolve(json);
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

        const url = collectionUrl + '/' + id;

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

        const url = collectionUrl + '/' + id;

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
        const url = collectionUrl + '/' + id;

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
