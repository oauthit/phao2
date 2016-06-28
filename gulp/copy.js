'use strict';

import gulp from 'gulp';
import paths from './conf';

gulp.task('copy:extras', () => {
  return gulp.src([
      `${paths.clientPath}/favicon.ico`,
      `${paths.clientPath}/robots.txt`,
      `${paths.clientPath}/.htaccess`
    ], {dot: true})
    .pipe(gulp.dest(`${paths.dist}/${paths.clientPath}`));
});

gulp.task('copy:server', () => {
  return gulp.src([
      'package.json'
    ], {cwdbase: true})
    .pipe(gulp.dest(paths.dist));
});

