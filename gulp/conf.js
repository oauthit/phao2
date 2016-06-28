'use strict';

let config, isBuild;

const serverPath = 'server';
export default {
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
