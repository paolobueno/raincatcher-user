var assert = require('assert');
var hash = require('./hash');
describe('hash', function() {
  describe('#saltAndHash', function() {
    it('should hash a password [slow]', function(done) {
      hash.saltAndHash('Password1', function(err) {
        assert(!err);
        done();
      });
    });
    it('should also the cipher, iterations and salt [slow]', function(done) {
      hash.saltAndHash('Password1', function(err, hashed) {
        assert.equal(hashed.split(hash.separator).length, 4);
        done();
      });
    });
  });
  describe('#verify', function() {
    it('should return true for a correct password [slow]', function(done) {
      hash.verify('Password1',
        'sha1:10000:cb535985929bee12820710726dc9d0a3d8412657234c1d45999cadabfcf410b6164a9' +
        '2cc701b9d882e6b0839fd656efe108c467f8f3f6463943af6f1f3458acff1bc7b12b67e1c71e2d1f' +
        'cda2f73250cf13facf3986ad33b4f896eed7128711c3212e9e4fdb35ce4fbc53b07aa3586193cfcd' +
        '45fab28e842074990b0b864ff463258097e12af3f300878bc4bbc86954e7cd6419cd781569950944' +
        '0d6de4ac32f246528491b8d746d5d38a194be10fc4bb2e34eaf0c0005c93fd0a5fc74e1af56f82f7' +
        'f348bc436c63c26b8f97cef0aea05554223e8e4bfc00d8f235e7276575890d5218e73fbca2b68706' +
        '88b4d593a4e88ac9acd8d2c37fff77d79b7eb65dba2:241b61b7b3e8912b3e3e1351d410ce6deb05' +
        'ba953f92092916df7e025dcfdaaa96dd4cb3b0f7017b875d97f8dfbb2551550990bdae5b4024e5dc' +
        'ba84affafc40', function(err, match) {
          assert(!err);
          assert(match);
          done();
        });
    });
    it('should return an error on a malformed string', function(done) {
      hash.verify('Password1', 'invalidhash', function(err) {
        assert(err);
        done();
      });
    });
    it('should return false for a incorrect password', function(done) {
      hash.verify('Password1', 'sha512:1:hashy:salty', function(err, match) {
        assert(!err);
        assert(!match);
        done();
      });
    });
    it('should return true for a #saltAndHash-ed password [slow]', function(done) {
      hash.saltAndHash('Password1', function(err, hashed) {
        assert(!err);
        hash.verify('Password1', hashed, function(err, match) {
          assert(!err);
          assert(match);
          done();
        });
      });
    });
  });
});