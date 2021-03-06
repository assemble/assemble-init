'use strict';

var should = require('should');
var assemble = require('assemble');
var gulp = require('gulp');
var Render = require('template-render');
var through = require('through2');
var Init = require('../');

describe('template-init', function () {
  var inst = null;
  var render = null;
  var init = null;

  beforeEach(function () {
    inst = assemble.init();
    render = Render(inst);
    init = Init(inst);
  });

  it('should init files from gulp.src', function (done) {
    var stream = gulp.src('test/fixtures/*.hbs')
      .pipe(init());

    stream.on('data', function (file) {
        file.contents.toString().should.eql('test: {{ msg }}\n');
      })
      .on('error', done)
      .on('end', done);
  });

  it('should init files from gulp.src and assemble.pages', function (done) {
    inst.pages({
      one: { path: 'one.hbs', content: '---\nmsg: hello one\n---\n1: {{ msg }}' },
      two: { path: 'two.hbs', content: '---\nmsg: hello two\n---\n2: {{ msg }}' },
      three: { path: 'three.hbs', content: '---\nmsg: hello three\n---\n3: {{ msg }}' },
      four: { path: 'four.hbs', content: '---\nmsg: hello four\n---\n4: {{ msg }}' }
    });

    var count = 0;
    gulp.src('test/fixtures/*.hbs')
      .pipe(init())
      .on('data', function (file) {
        count++;
        switch (file.path) {
          case 'one.hbs':
            file.contents.toString().should.eql('1: {{ msg }}');
            break;
          case 'two.hbs':
            file.contents.toString().should.eql('2: {{ msg }}');
            break;
          case 'three.hbs':
            file.contents.toString().should.eql('3: {{ msg }}');
            break;
          case 'four.hbs':
            file.contents.toString().should.eql('4: {{ msg }}');
            break;
        }
      })
      .on('error', done)
      .on('end', function () {
        count.should.eql(5);
        done();
      });
  });

  it('should create a `files` object on `app`', function (done) {
    inst.task('test', function () {
      return gulp.src('test/fixtures/*.hbs')
        .pipe(init())
        .on('end', function () {
          inst.views.should.have.property('task_tests');
          Object.keys(inst.views['task_tests']).length.should.eql(1);
          Object.keys(inst.files).length.should.eql(1);
          inst.files.should.eql(inst.views['task_tests']);
        });
    });
    inst.task('default', ['test'], function () { done(); });
    inst.run('default');
  });

  it('should create a unique `files` object for each task', function (done) {
    inst.task('test-a', function (done) {
      return gulp.src('test/fixtures/*.hbs')
        .pipe(init())
        .on('end', function () {
          inst.views.should.have.property('task_test-as');
          Object.keys(inst.views['task_test-as']).length.should.eql(1);
          Object.keys(inst.files).length.should.eql(1);
          inst.files.should.eql(inst.views['task_test-as']);
        });
    });

    inst.task('test-b',  function () {
      return gulp.src('test/fixtures/*.hbs')
        .pipe(init())
        .on('end', function () {
          inst.views.should.have.property('task_test-bs');
          Object.keys(inst.views['task_test-bs']).length.should.eql(1);
          Object.keys(inst.files).length.should.eql(1);
          inst.files.should.eql(inst.views['task_test-bs']);
        });
    });

    inst.task('default', ['test-a', 'test-b'], function () {
      done();
    });
    inst.run('default');
  });
});
