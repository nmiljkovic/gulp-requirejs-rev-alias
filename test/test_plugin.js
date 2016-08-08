var revAlias = require('../index');
var assert = require('stream-assert');
var expect = require('chai').expect;
var sinon = require('sinon');
var gulp = require('gulp');
var path = require('path');
var fs = require('fs');
var File = require('gulp-util').File;

function fixtures(files) {
    return path.join(__dirname, 'fixtures', files);
}

describe('requirejs-rev-alias', function () {

    it('should ignore null files', function (done) {
        var cb = sinon.spy();
        var stream = revAlias({
            alias: cb,
            manifest: gulp.src(fixtures('manifest.json'))
        });

        stream
            .pipe(assert.length(1))
            .pipe(assert.end(completed));
        stream.write(new File());
        stream.end();

        function completed() {
            expect(cb.calledOnce).to.eql(false);
            done();
        }
    });

    it('should fail without options', function (done) {
        gulp.src(fixtures('config.js'))
            .pipe(revAlias())
            .on('error', function (err) {
                expect(err.message).to.eql('Options are required.');
                done();
            });
    });

    it('should emit error on streamed file', function (done) {
        gulp.src(fixtures('config.js'), {buffer: false})
            .pipe(revAlias({
                manifest: gulp.src(fixtures('manifest.json'))
            }))
            .on('error', function (err) {
                expect(err.message).to.eql('Streams are not supported.');
                done();
            });
    });

    it('should alias paths', function (done) {
        gulp.src(fixtures('config.js'))
            .pipe(revAlias({
                manifest: gulp.src(fixtures('manifest.json'))
            }))
            .pipe(assert.length(1))
            .pipe(assert.first(function (file) {
                var expected = fs.readFileSync(fixtures('config.expected.js'), {encoding: 'utf-8'});
                expect(file.contents.toString()).to.equal(expected);
            }))
            .pipe(assert.end(done));
    });

    it('should allow alias changing', function (done) {
        gulp.src(fixtures('config.js'))
            .pipe(revAlias({
                manifest: gulp.src(fixtures('manifest.json')),
                alias: function (original, revisioned) {
                    return {
                        original: original.replace(/\.js$/, ''),
                        revisioned: path.join('prefix', revisioned).replace(/\.js$/, '')
                    };
                }
            }))
            .pipe(assert.length(1))
            .pipe(assert.first(function (file) {
                var expected = fs.readFileSync(fixtures('config.expected.prefix.js'), {encoding: 'utf-8'});
                expect(file.contents.toString()).to.equal(expected);
            }))
            .pipe(assert.end(done));
    });

});
