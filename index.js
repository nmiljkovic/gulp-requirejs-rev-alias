var PluginError = require('gulp-util').PluginError;
var transformConfig = require('gulp-requirejs-transformconfig');
var through = require('through2');
var combine = require('stream-combiner');
var isFunction = require('lodash.isfunction');
var isUndefined = require('lodash.isundefined');

function createErrorPassthrough(error) {
    var err = createError(error);
    return through.obj(function (file, encoding, cb) {
        cb(err, file);
    });
}

function createError(error) {
    return new PluginError('gulp-requirejs-rev-alias', error);
}

module.exports = function (options) {
    /**
     * The array is shared between the two processors,
     * because transformConfig does not support async computation.
     * This is fine in this case, as transformConfig is
     *
     * @type {Array}
     */
    var aliases = [];

    return combine(
        collectManifest(options, aliases),
        transformConfigPaths(options, aliases)
    );
};

/**
 * Reads the provided manifest and populates the aliases array.
 *
 * @param {Object} options
 * @param {Stream} options.manifest
 * @param {Array} aliases
 * @return {*}
 */
function collectManifest(options, aliases) {
    if (isUndefined(options)) {
        return createErrorPassthrough('Options are required.');
    }

    if (isUndefined(options.manifest)) {
        return createErrorPassthrough('Must provide a manifest stream.');
    }

    var ended = false, queued = [];
    options.manifest.on('data', function (file) {
        var manifest = JSON.parse(file.contents.toString());
        Object.keys(manifest).forEach(function (original) {
            aliases.push({
                original: original,
                revisioned: manifest[original]
            });
        });
    });

    options.manifest.on('end', function () {
        ended = true;
        queued.forEach(function (cb) {
            cb();
        });
    });

    return through.obj(function alias(file, encoding, cb) {
        if (ended) {
            return end();
        }

        queued.push(end);

        function end() {
            cb(null, file);
        }
    });
}

/**
 * Transforms the requirejs config with alias entries in the paths object.
 *
 * If options.alias is provided it is called with every alias (original, revisioned).
 * Return an object two properties: {revisioned: String, original: String} to modify the mapping.
 *
 * Existing entries in requirejs config will be replaced.
 *
 * @param {Object} options
 * @param {Function} [options.alias]
 * @param {Array} aliases
 */
function transformConfigPaths(options, aliases) {
    return transformConfig(function (config) {
        if (isFunction(options.alias)) {
            aliases = aliases.map(function (alias) {
                return options.alias(alias.original, alias.revisioned);
            });
        }

        if (isUndefined(config.paths)) {
            config.paths = {};
        }

        aliases.forEach(function (alias) {
            config.paths[alias.original] = alias.revisioned;
        });

        return config;
    });
}
