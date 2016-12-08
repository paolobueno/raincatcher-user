const assert = require('assert');
const hash = require('./hash');
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
        'sha512:10000:abfe3a9c913597118fc4a4d47949dfd5dc417c624a801cd51b84847b6e672d13326' +
        '1895bcf739a2610439cfc62c2c1d3656625862024ea31b3dc9209557b9bd53a35e4b7ecafd3df7ca' +
        'be38fb74882411f9929f106e51acea6ccf93bfec756b542d368da13bdfb0f9dd7c2b4d3313161fb8' +
        '19d97a3f765011297775b5ec1eb8262cd791d512ab59b546e34e6f51ab310a892f02da26590ace85' +
        'c5ccd20d3cfcb8a0b8177bfba379351544b93b5b28ac70a686db11dc5fc505841b78bd5aa2234847' +
        '61ef7be1cb5945c02727288b7d3fee302225641e766c7444bc6c43f09c3f7d224c663adaae1f842c' +
        'acb9cb07d407f52c3d8e3d20593bb7d13d46cd9e925ed:4a74d484873b63b2150a79a04483f5df45' +
        'a521abd98b2ba479567d9b3b004925233b1813d449f21377131ae18f64b2d13b41b3dfcb1ef95adf' +
        '15082d24428645', function(err, match) {
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