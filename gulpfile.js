var config = {
	version: "1.0.0",
	debug: true,
	dest: 'dist',
	vendor: {
		js: [
			'./bower_components/jquery/dist/jquery.min.js',
		],
		css: [],
		fonts: []
	}
}

/*
  gulpfile inspired by https://medium.com/@dickeyxxx/best-practices-for-building-angular-js-apps-266c1a4a6917#.7msc3ilwj
*/

var gulp = require('gulp')
$ = require('gulp-load-plugins')(),
path = require('path'),
args = require('yargs').argv,
streamqueue = require('streamqueue'),
fs = require('fs');

if (fs.existsSync('./config.js')) {
	var configFn = require('./config');
	configFn(config);
};

gulp.task('build', function () {
	var streamBuildAction = streamqueue({
		objectMode: true
	  },
    //gulp.src(config.vendor.js),
    gulp.src(['src/**/module.js', 'src/filters/*.js', 'src/lib/**/*.js'])
  );
  return streamBuildAction
  .pipe($.angularFilesort())
  .pipe($.sourcemaps.init())
  .pipe($.concat('ng-meumobi-utils.js'))
  .pipe($.ngAnnotate())
  // Strip console, alert, and debugger statements from JavaScript code
  // https://github.com/sindresorhus/strip-debug
	.pipe($.if(!config.debug, $.stripDebug()))
	.pipe($.if(!config.debug, $.uglify({ mangle: false })))
  .pipe(gulp.dest(config.dest))
  .pipe($.rename({suffix: '.min'}))
  .pipe($.sourcemaps.write())
  .pipe(gulp.dest(config.dest));
})

/*
  http://eslint.org/docs/rules/
  https://davidwalsh.name/gulp-eslint
  https://www.npmjs.com/package/gulp-eslint
  https://glebbahmutov.com/blog/1-2-3-linted/
  $ npm install gulp-eslint eslint-plugin-angular eslint-config-angular
https://github.com/Gillespie59/eslint-plugin-angular

  .pipe($.eslint({
    'rules':{
      'quotes': [1, 'single'],
      'semi': [1, 'always'],
      'angular/deferred': [1, 'always'],
      'no-inner-declarations': 1
      //'angular/definedundefined': [0, 'always']
    }
  }))
*/
gulp.task('eslint', function() {
  return gulp.src('./src/lib/**/*.js')
  .pipe($.eslint({
  			// Load a specific ESLint config
  			configFile: '.eslintrc.json'
  		}))
  .pipe($.eslint.format())
  .pipe($.eslint.failAfterError());
});

/*
  https://github.com/jshint/fixmyjs
  http://addyosmani.com/blog/fixmyjs/
  To run trial use following command
  $ fixmyjs -r src/services/Polls_meumobi.services.js --legacy
*/ 
gulp.task('fixmyjs', function() {
  var legacy = args.legacy ? args.legacy : true;
	return gulp.src("./src/**/*.js")
	//.pipe($.fixmyjs({legacy: legacy}))
	.pipe(gulp.dest("./src/"));
});

// https://github.com/pgilad/gulp-todo
gulp.task('todo', function() {
	return gulp.src("./src/**/*.js")
	.pipe($.todo({ fileName: 'TODO.md', verbose: true }))
	.pipe(gulp.dest('./'));
});

gulp.task('help', $.taskListing);