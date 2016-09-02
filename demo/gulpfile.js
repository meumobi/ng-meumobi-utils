// Please use config.js to override these selectively:
var config = {
  dest: 'www',
  debug: true,
  cordova: true,
  vendor: {
    js: [
      './bower_components/angular/angular.min.js',
      './bower_components/onsenui/js/onsenui.min.js',
      './bower_components/angular-ui-router/release/angular-ui-router.min.js',
			'./bower_components/onsenui/js/angular-onsenui.js'
    ],

    css: {
      prepend: [],
      append: [
        './bower_components/onsenui/css/onsen-css-components.css',
        './bower_components/onsenui/css/onsenui.css',
        './bower_components/onsenui/css/ionicons/css/ionicons.min.css',
        './bower_components/onsenui/css/font_awesome/css/font-awesome.min.css',
        './bower_components/onsenui/css/material-design-iconic-font/css/material-design-iconic-font.min.css'
      ],
    },

    fonts: [
      './bower_components/onsenui/css/font_awesome/fonts/fontawesome-webfont.*',
      './bower_components/onsenui/css/ionicons/fonts/ionicons.*',
      './bower_components/onsenui/css/material-design-iconic-font/fonts/Material-Design-Iconic-Font.*'
    ]
  },
  weinre: {
    httpPort:     8001,
    boundHost:    'localhost',
    verbose:      false,
    debug:        false,
    readTimeout:  5,
    deathTimeout: 15
  }
};

var gulp = require('gulp'),
    bower = require('gulp-bower'),
    rimraf = require('rimraf'),
    serve = require('gulp-serve'),
    browserSync = require('browser-sync').create(),    
    $ = require('gulp-load-plugins')(),
  	streamqueue = require('streamqueue'),
    path = require('path'),
    seq = require('run-sequence'),
    args = require('yargs').argv;


if (require('fs').existsSync('./config.js')) {
  var configFn = require('./config');
  configFn(config);
}

gulp.task('fonts', function() {
return gulp.src(
	config.vendor.fonts)
	.pipe(gulp.dest(path.join(config.dest, 'fonts')));
});

gulp.task('images', function() {
return gulp.src("src/images/**/*")
	.pipe(gulp.dest(path.join(config.dest, 'images')));
});

gulp.task('html', ['ons-templates'], function() {
	var inject = [];
	if (typeof config.weinre === 'object' && config.debug) {
		inject.push('<script src="http://' + config.weinre.boundHost + ':' + config.weinre.httpPort + '/target/target-script-min.js"></script>');
	}
	if (config.cordova) {
		inject.push('<script src="cordova.js"></script>');
	}
	return gulp.src(['src/html/**/*.html'])
	.pipe($.replace('<!-- inject:js -->', inject.join('\n    ')))
	.pipe(gulp.dest(config.dest));
});

gulp.task('ons-templates', function() {
	return gulp.src('src/ons-templates/**/*')
	.pipe(gulp.dest(path.join(config.dest, 'ons-templates')));
});

gulp.task('css', function() {
	var streamBuildAction = streamqueue({
		objectMode: true
	},
	gulp.src(config.vendor.css.append),
	gulp.src('./src/css/**/*.css')
	);
	return streamBuildAction
  .pipe($.concat('app.css'))
  .pipe($.if(!config.debug, $.cssmin()))
  .pipe($.rename({suffix: '.min'}))
  .pipe(gulp.dest(path.join(config.dest, 'css')));
});

gulp.task('locales', function() {
	return gulp.src('src/locales/**/*')
	.pipe(gulp.dest(path.join(config.dest, 'locales')));
});

gulp.task('js', function() {
	var streamBuildAction = streamqueue({
		objectMode: true
	},
	gulp.src(config.vendor.js),
	gulp.src('./src/js/**/*.js')
	.pipe($.angularFilesort()),
	gulp.src(['src/templates/**/*.html'])
	.pipe($.angularTemplatecache({
			module: 'meu-app'
		}))
	);
	return streamBuildAction
	.pipe($.sourcemaps.init())
	.pipe($.concat('app.js'))
	.pipe($.ngAnnotate())
	.pipe($.if(!config.debug, $.stripDebug()))
	//.pipe($.if(!config.debug, $.uglify({ mangle: false })))
	.pipe($.rename({suffix: '.min'}))
	//.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest(path.join(config.dest, 'js')));
});

gulp.task('install', ['clean'], function(cb) {
  return bower();
});

gulp.task('build', function(done) {
	var tasks = ['html', 'fonts', 'css', 'js', 'locales', 'images'];
	seq(tasks, done);
});

gulp.task('clean', function(cb) {
  rimraf('./bower_components', function() {
    rimraf('./www/*', cb);
  });
});

gulp.task('watch', function() {
  gulp.watch(config.dest + '/**/*', function() {
    browserSync.reload();
  });
  gulp.watch(['./src/html/**/*', './src/ons-templates/**/*'], ['html']);
  gulp.watch([config.vendor.css.append, './src/css/**/*'], ['css']);
  gulp.watch([config.vendor.js, './src/js/**/*', './src/templates/**/*'], ['js']);
});

gulp.task('serve', ['build', 'watch'], function() {
  browserSync.init({
    server: {
      baseDir: __dirname + '/www/',
      directory: false
    },
    ghostMode: false,
    notify: false,
    debounce: 200,
    index: 'index.html'
  });
});