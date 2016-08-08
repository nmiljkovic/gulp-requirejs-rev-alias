# gulp-requirejs-rev-alias

A gulp plugin to alias modules based on revision manifest.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install gulp-requirejs-rev-alias --save-dev`

## Basic usage

You can generate your manifest with `gulp-rev`. When generating your requirejs config, use the manifest option and pass in the stream to your manifest(s).

```js
var revAlias = require('gulp-requirejs-rev-alias');

gulp.task('rev-alias', function() {
    return gulp.src('path/to/config.js')
        .pipe(revAlias({
            manifest: gulp.src('path/to/manifest.json')
        }))
        .pipe(gulp.dest('path/to/dist'));
});
```

With an example manifest:

```json
{
    "exists-and-replaced": "exists-and-replaced-123456",
    "new-entry": "new-entry-654321"
}
```

The require config gets transformed from:

```js
require.config({
    paths: {
        'non-existent': 'should/be/unchanged',
        'exists-and-replaced': 'do-not-see-this'
    }
});
```

To:

```js
require.config({
    paths: {
        'non-existent': 'should/be/unchanged',
        'exists-and-replaced': 'exists-and-replaced-123456',
        'new-entry': 'new-entry-654321'
    }
});
```

If you want to do transformations on your manifest, you can provide an alias option:

```js
revAlias({
    manifest: gulp.src('...'),
    alias: function (original, revisioned) {
        return {
            original: original,
            revisioned: path.join('prefix', revisioned)
        };
    }
});
```

The resulting config would be:

```js
require.config({
    paths: {
        'non-existent': 'should/be/unchanged',
        'exists-and-replaced': 'prefix/exists-and-replaced-123456',
        'new-entry': 'prefix/new-entry-654321'
    }
});
```

If the alias function returns `false` for an entry, the entry is ignored.
