'use strict';

import gulp from 'gulp';
import conf from './conf';
import gulpLoadPlugins from 'gulp-load-plugins';
import pipes from './reusablePipelines';
import del from 'del';
import runSequence from 'run-sequence';
import _ from 'lodash';

let plugins = gulpLoadPlugins();

/********************
 * Build
 ********************/

gulp.task('build', cb => {
  conf.isBuild = true;

  runSequence([
      'clean:dist',
      'clean:tmp'
    ],
    [
      'copy:extras',
      'copy:fonts',
      'copy:assets',
      'copy:server',
      'transpile:server'
    ],
    cb);
});

gulp.task('clean:dist', () => del([`${conf.dist}/!(.git*|.openshift|Procfile)**`], {dot: true}));


gulp.task('transpile:server', () => {
  return gulp.src(_.union(conf.server.scripts, conf.server.json))
    .pipe(pipes.transpileServer())
    .pipe(gulp.dest(`${conf.dist}/${conf.serverPath}`));
});

gulp.task('clean:tmp', () => del(['.tmp/**/*'], {dot: true}));


