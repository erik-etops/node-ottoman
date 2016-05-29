var chai = require('chai');
var expect = chai.expect;
var H = require('./harness');
var ottoman = H.lib;

var couchbase = null;

try {
    couchbase = require('couchbase');
} catch (err) {
    couchbase = null;
}

/**
 * The purpose of this test is to create a semi-complex model with a lot of n1ql
 * indexes that need to be bulk created, then test that ensureIndices really does
 * guarantee they are all in the ready state before it is called.
 * 
 * Check if CNCSTR is there, otherwise tests are being run with a mocked store,
 * and this test does not apply to mocked stores.
 */
if (couchbase && process.env.CNCSTR) {
    describe('N1QL Bulk Indexing', function () {
        this.timeout(20000); 
        
        var modelId = H.uniqueId('Alphabet_N1QL_Bulk_Indexing');

        var alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i',
            'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v',
            'w', 'x', 'y', 'z'];

        var assignType = function (idx) {
            var types = ['Mixed', 'string', 'integer', 'boolean', 'Date', 'number'];
            return types[idx % types.length];
        };

        var schema = {};
        var indices = {};

        for (var i = 0; i < alphabet.length; i++) {
            schema['field' + alphabet[i]] = assignType(i);
            indices['findBy' + alphabet[i]] = {
                type: 'n1ql',
                by: alphabet[i],
                consistency: ottoman.Consistency.GLOBAL
            };
        }

        var options = { index: indices };
        var TestMdl = ottoman.model(modelId, schema, options);

        // If ensureIndices works properly, then this should always return nothing.
        var checkQueryStr = 'SELECT name, state FROM system:indexes WHERE name like \'' +
            modelId + '%\' and state <> \'online\'';

        it('should callback from ensureIndices only when all indexes ready', function (done) {
            ottoman.ensureIndices(function (err) {
                if (err) { return done(err); }

                var query = couchbase.N1qlQuery.fromString(checkQueryStr);
                ottoman.bucket.query(query, function (err, rows, meta) {
                    expect(err).to.be.null;

                    // If query returns anything, test fails.
                    if (rows.length > 0) {
                        done('Some n1ql indices not yet online: ' +
                            rows.map(function (i) {
                                return i.name + ': state ' + i.state;
                            }).join(', '));
                    } else {
                        console.log('ROWS: ' + JSON.stringify(rows));
                        console.log('META: ' + JSON.stringify(meta));
                        done();
                    }
                });
            });
        });
    });
}
