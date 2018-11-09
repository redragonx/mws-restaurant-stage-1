/* eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var eslint = require('gulp-eslint');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var useref = require('gulp-useref');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var gulpIf = require('gulp-if');
var del = require('del');
var babel = require("gulp-babel");

gulp.task('default', [
    'delete-all-dist', 'copy-html', 'copy-metafiles', 'copy-images', 'styles-dev', 'scripts-dev'
], function() {
    gulp.watch('sass/**/*.sass', ['styles-dev']);
    gulp.watch('app/js/*.js', ['scripts-dev']);
    gulp.watch('app/index.html', ['copy-html']);
    gulp.watch('app/restaurant.html', ['copy-html']);
    gulp.watch('./dist/index.html').on('change', browserSync.reload);
    gulp.watch('./dist/restaurant.html').on('change', browserSync.reload);

    browserSync.init({server: './dist'});
});

gulp.task('delete-all-dist', function() {

    del(['dist/*']).then(paths => {
        console.log('Deleted files and folders:\n', paths.join('\n'));
    });
});

gulp.task('dist', [ 'copy-html', 'copy-metafiles', 'copy-images', 'scripts-dev', 'styles-dev',]);

gulp.task('copy-html', function() {
    gulp.src('app/index.html').pipe(gulp.dest('./dist'));
    gulp.src('app/restaurant.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-metafiles', function() {
    gulp.src('app/manifest.json').pipe(gulp.dest('./dist'));
    gulp.src('app/favicon.ico').pipe(gulp.dest('./dist'));

});

gulp.task('copy-images', function() {
    gulp.src('img/*').pipe(gulp.dest('dist/img'));
});
gulp.task('scripts-dev', function() {
    return gulp.src('app/js/*.js').pipe(sourcemaps.init()).pipe(uglify()).pipe(sourcemaps.write()).pipe(gulp.dest('./dist/js'))
});
gulp.task('styles-dev', function() {
    gulp.src('app/sass/**/*.sass').pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError)).pipe(autoprefixer({browsers: ['last 2 versions']})).pipe(gulp.dest('dist/css')).pipe(browserSync.stream());
});
