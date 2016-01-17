'use strict';

import gulp from 'gulp';
import del from 'del';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

// Lint JavaScript
gulp.task('lint', () =>
	gulp.src('app/scripts/*.js')
	.pipe($.eslint())
	.pipe($.eslint.format())
	.pipe($.if(!browserSync.active, $.eslint.failOnError()))
);

// Optimize images
gulp.task('images', () =>
	gulp.src('app/images/**/*')
	.pipe($.cache($.imagemin({
		progressive: true,
		interlaced: true
	})))
	.pipe(gulp.dest('dist/images'))
	.pipe($.size({
		title: 'images'
	}))
);

// Copy all files at the root level (app)
gulp.task('copy', () =>
	gulp.src([
		'app/*',
		'!app/*.html',
		'node_modules/apache-server-configs/dist/.htaccess'
	], {
		dot: true
	}).pipe(gulp.dest('dist'))
	.pipe($.size({
		title: 'copy'
	}))
);

// Compile and automatically prefix stylesheets
gulp.task('styles', () => {
	const AUTOPREFIXER_BROWSERS = [
		'ie >= 10',
		'ie_mob >= 10',
		'ff >= 30',
		'chrome >= 34',
		'safari >= 7',
		'opera >= 23',
		'ios >= 7',
		'android >= 4.4',
		'bb >= 10'
	];

	// For best performance, don't add Sass partials to `gulp.src`
	return gulp.src('app/styles/sass/*.sass')
		.pipe($.newer('.tmp/styles'))
		.pipe($.sourcemaps.init())
		.pipe($.sass({
			precision: 10
		}).on('error', $.sass.logError))
		.pipe($.autoprefixer(AUTOPREFIXER_BROWSERS))
		.pipe(gulp.dest('.tmp/styles'))
		.pipe(gulp.dest('app/styles/css'))
		.pipe($.if('*.css', $.cssnano()))
		.pipe($.size({
			title: 'styles'
		}))
		.pipe($.sourcemaps.write('./'))
		.pipe(gulp.dest('dist/styles'));
});

// Concatenate and minify JavaScript.
gulp.task('scripts', () =>
	gulp.src([
		'./app/scripts/main.js'
	])
	.pipe($.newer('.tmp/scripts'))
	.pipe($.sourcemaps.init())
	.pipe($.babel())
	.pipe($.sourcemaps.write())
	.pipe(gulp.dest('.tmp/scripts'))
	.pipe($.concat('main.min.js'))
	.pipe($.uglify({
		preserveComments: 'some'
	}))
	.pipe($.size({
		title: 'scripts'
	}))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('dist/scripts'))
);

// Scan your HTML for assets & optimize them
gulp.task('html', () => {
	return gulp.src('app/**/*.html')
		.pipe($.useref({
			searchPath: '{.tmp,app}'
		}))
		.pipe($.if('*.css', $.uncss({
			html: [
				'app/index.html'
			],
			ignore: []
		})))
		.pipe($.if('*.css', $.cssnano()))

	.pipe($.if('*.html', $.htmlmin({
			removeComments: true,
			collapseWhitespace: true,
			collapseBooleanAttributes: true,
			removeAttributeQuotes: true,
			removeRedundantAttributes: true,
			removeEmptyAttributes: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: true,
			removeOptionalTags: true
		})))
		.pipe($.if('*.html', $.size({
			title: 'html',
			showFiles: true
		})))
		.pipe(gulp.dest('dist'));
});

// Clean output directory
gulp.task('clean', () => del(['.tmp', 'dist/*', '!dist/.git', 'app/styles/css/*'], {
	dot: true
}));

// Watch files for changes & reload
gulp.task('serve', ['scripts', 'styles'], () => {
	browserSync({
		notify: false,
		logPrefix: 'DPS',
		scrollElementMapping: ['body'],
		// https: true,
		server: ['.tmp', 'app'],
		port: 3000
	});

	gulp.watch(['app/**/*.html'], ['html', reload]);
	gulp.watch(['app/styles/**/*.{sass,css}'], ['styles', reload]);
	gulp.watch(['app/scripts/**/*.js'], ['lint', 'scripts', reload]);
	gulp.watch(['app/images/**/*'], ['images', reload]);
});

// Build and serve the output from the dist build
gulp.task('build', ['lint', 'images', 'copy', 'scripts', 'styles', 'html'], () => {
	browserSync({
		notify: false,
		logPrefix: 'DPB',
		scrollElementMapping: ['body'],
		// https: true,
		server: 'dist',
		port: 3001
	});

	gulp.watch(['app/**/*.html'], ['html', reload]);
	gulp.watch(['app/styles/**/*.{sass,css}'], ['styles', reload]);
	gulp.watch(['app/scripts/**/*.js'], ['lint', 'scripts', reload]);
	gulp.watch(['app/images/**/*'], ['images', reload]);
});
