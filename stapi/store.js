'use strict';

var Container = require('js-data').Container;
var HttpAdapter = require('js-data-http-node');

const adapter = new HttpAdapter({
  basePath: 'http://localhost:9000/api/aa',
  httpConfig: {
    address: 'http://localhost',
    port: 9000
  },
  error: function (err) {
    console.log(err);
  }
});
const store = new Container();
store.registerAdapter('http', adapter, {default: true});

exports.module = store;
