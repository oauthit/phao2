'use strict';

let config, isBuild;

const clientPath = require('../bower.json').appPath || 'client';
const serverPath = 'server';
export default {
  clientPath: clientPath,
  serverPath: serverPath,
  config: config,
  isBuild: isBuild,
  server: {
    scripts: [`${serverPath}/**/!(*.spec|*.integration).js`],
    json: [`${serverPath}/**/*.json`],
    test: {
      integration: [`${serverPath}/**/*.integration.js`, 'mocha.global.js'],
      unit: [`${serverPath}/**/*.spec.js`, 'mocha.global.js']
    }
  },
  karma: 'karma.conf.js',
  dist: 'dist'
};
