const {
    src,
    dest,
    watch
} = require('gulp')

const sass = require('gulp-sass')

function defaultTask() {
    return src('scss/**/*.scss')
        .pipe(sass({
            outputStyle: 'nested'
        }))
        .pipe(dest('public/css'));
}


watch('scss/**/*.scss', defaultTask)
// watch('js/**/*.js', jsminTask)

exports.default = defaultTask