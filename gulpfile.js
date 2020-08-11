var syntax         = 'scss', // Syntax: sass or scss;
	gmWatch        = false; // ON/OFF GraphicsMagick watching "img/_src" folder (true/false). Linux install gm: sudo apt update; sudo apt install graphicsmagick

var     gulp          = require('gulp');
const   sass          = require('gulp-sass'),
        browserSync   = require('browser-sync'),
        concat        = require('gulp-concat'),
        uglify        = require('gulp-uglify'),
        cleancss      = require('gulp-clean-css'),
        rename        = require('gulp-rename'),
        autoprefixer  = require('gulp-autoprefixer'),
        notify        = require('gulp-notify'),
        rsync         = require('gulp-rsync'),
        imageResize   = require('gulp-image-resize'),
        imagemin      = require('gulp-imagemin'),
        del           = require('del'),
        pug			  = require('gulp-pug'),
        copy 		  = require('gulp-copy');
	
	var paths = {
		dest_js:"www/js",
		dest_css:"www/css",
		dest_pug:"www",
		application_base:"www"
	};

// Local Server
gulp.task('browser-sync', function() {
	browserSync({
		server: {
			baseDir: paths.application_base,

		},
		notify: false,
		open: false,
		// online: false, // Work Offline Without Internet Connection
		// tunnel: true, 
		// tunnel: "greatit", // Demonstration page: http://greatit.localtunnel.me
	})
});

// Sass|Scss Styles
gulp.task('styles', function() {
	return gulp.src(['app/'+syntax+'/**/*.'+syntax])
	.pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
	.pipe(rename({ suffix: '.min', prefix : '' }))
	.pipe(autoprefixer(['last 15 versions']))
	.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
	.pipe(gulp.dest(paths.dest_css))
	.pipe(browserSync.stream())
});

// JS
gulp.task('scripts', function() {
	return gulp.src([
        'node_modules/jquery/dist/jquery.min.js',
		'app/js/common.js', // Always at the end
		])
	.pipe(concat('scripts.min.js'))
	// .pipe(uglify()) // Mifify js (opt.)
	.pipe(gulp.dest(paths.dest_js))
	.pipe(browserSync.reload({ stream: true }))
});

// Images @x1 & @x2 + Compression | Required graphicsmagick (sudo apt update; sudo apt install graphicsmagick)
gulp.task('img1x', function() {
	return gulp.src('app/img/_src/**/*.*')
	.pipe(imageResize({ width: '50%' }))
	.pipe(imagemin())
	.pipe(gulp.dest(paths.application_base+'/img/@1x/'))
});
gulp.task('img2x', function() {
	return gulp.src('app/img/_src/**/*.*')
	.pipe(imageResize({ width: '100%' }))
	.pipe(imagemin())
	.pipe(gulp.dest(paths.application_base+'/img/@2x/'))
});

// Clean @*x IMG's
gulp.task('cleanimg', function() {
	return del([paths.application_base+'/img/@*'], { force:true })
});

// Pug live reload
gulp.task('pug-files', function(){
	return gulp.src([
		"app/pug/*.pug",
	])
	.pipe(pug({
		pretty: true,
	}))
	.pipe(gulp.dest(paths.dest_pug))
	.pipe(browserSync.reload({ stream: true }))
});

// Deploy
gulp.task('rsync', function() {
	return gulp.src('www/**')
	.pipe(rsync({
		root: 'www/',
		hostname: 'username@yousite.com',
		destination: 'yousite/public_html/',
		// include: ['*.htaccess'], // Includes files to deploy
		exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
		recursive: true,
		archive: true,
		silent: false,
		compress: true
	}))
});

// Img Processing Task for Gulp 4
gulp.task('img', gulp.parallel('img1x', 'img2x'));

// gulp watcher
gulp.task('watch', function() {
	gulp.watch('app/'+syntax+'/**/*.'+syntax+'', gulp.parallel('styles'));
	gulp.watch(['libs/**/*.js', 'app/js/common.js'], gulp.parallel('scripts'));
	gulp.watch([
		"app/pug/*.pug",
		"app/pug/**/*.pug",
		"app/pug/**/**/*.pug"
	], gulp.parallel('pug-files'));

	gmWatch && gulp.watch('app/img/_src/**/*', gulp.parallel('img')); // GraphicsMagick watching image sources if allowed.
});

// gulp default task
gmWatch ? gulp.task('default', gulp.parallel('img', 'styles', 'scripts', 'pug-files', 'browser-sync', 'watch')) 
				: gulp.task('default', gulp.parallel('styles', 'scripts', 'pug-files', 'browser-sync', 'watch'));
