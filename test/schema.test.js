'use strict';
var H = require('./harness');
var ottoman = H.lib;

var assert = require('assert');
var Schema = require('../lib/schema');

it('should provide a custom inspector for CoreTypes', function () {
  assert.equal(Schema.StringType.inspect(), 'CoreType(string)');
});

it('should provide a custom inspector for ModelRefs', function () {
  var testRef = new Schema.ModelRef('Test');
  assert.equal(testRef.inspect(), 'ModelRef(Test)');
});

describe('Dynamic schema capabilities', function () {
  it('should allow model field inspection', function (done) {
    var modelId = H.uniqueId('model');
    var TestMdl = ottoman.model(modelId, {
      name: 'string',
      x: 'number',
      doc: {
        subdoc: {
          deeper: {
            inception: {
              y: 'boolean'
            }
          }
        }
      }
    });

    var nameType = TestMdl.schema.field('name');
    var subdocType = TestMdl.schema.field('doc.subdoc');
    var yType = TestMdl.schema.field('doc.subdoc.deeper.inception.y');

    assert.equal(nameType.type, Schema.StringType);
    assert.equal(subdocType.type instanceof Schema.FieldGroup, true);
    assert.equal(yType.type, Schema.BooleanType);
    assert.equal(TestMdl.schema.field('NONEXISTANT'), null);

    done();
  });

  it('should allow adding fields after the fact', function (done) {
    var modelId = H.uniqueId('model');
    var TestMdl = ottoman.model(modelId, {
      name: 'string'
    });

    TestMdl.schema.addField({ name: 'added', type: 'string' });
    assert.equal(TestMdl.schema.field('added').type, Schema.StringType);
    done();
  });
});
