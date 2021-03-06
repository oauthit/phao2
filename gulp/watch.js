'use strict';
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import _ from 'lodash';
import pipes from './reusablePipelines';
import paths from './conf';

let plugins = gulpLoadPlugins();

gulp.task('watch', () => {
  var testFiles = _.union(paths.server.test.unit, paths.server.test.integration);

  plugins.livereload.listen({
    port: process.env.LIVERELOAD_PORT || 35555
  });

  plugins.watch(_.union(paths.server.scripts, testFiles))
    .pipe(plugins.plumber())
    .pipe(pipes.lintServerScripts())
    .pipe(plugins.livereload());

  plugins.watch(paths.server.views)
    .pipe(plugins.livereload());

  gulp.watch(testFiles, ['test:server']);
  gulp.watch('gulpfile.js', ['gulp-reload']);
});
