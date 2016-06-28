'use strict';

import gulp from 'gulp';
import paths from './conf';
import pipes from './reusablePipelines';
import runSequence from 'run-sequence';

gulp.task('test', cb => {
  return runSequence('test:server', cb);
});

//TODO add watcher for tests
//TODO uncomment if wanna coverage ya
gulp.task('test:server', cb => {
  runSequence(
    'env:all',
    'env:test',
    'mocha:unit',
    //'mocha:integration',
    //'mocha:coverage',
    cb);
});

gulp.task('mocha:unit', () => {
  return gulp.src(paths.server.test.unit)
    .pipe(pipes.mocha());
});

gulp.task('mocha:integration', () => {
  return gulp.src(paths.server.test.integration)
    .pipe(pipes.mocha());
});
