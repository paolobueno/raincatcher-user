const assert = require('assert');
const mbaas = require('./mbaas');
const config = require('../user/config-user');

const sampleProfileData = {
  id: 'rkX1fdSH',
  username: 'trever',
  name: 'Trever Smith',
  position: 'Senior Truck Driver',
  phone: '(265) 725 8272',
  email: 'trever@wfm.com',
  notes: 'Trever doesn\'t work during the weekends.',
  avatar: 'https://s3.amazonaws.com/uifaces/faces/twitter/kolage/128.jpg',
  banner: 'http://web18.streamhoster.com/pentonmedia/beefmagazine.com/TreverStockyards_38371.jpg',
  password: 'Password'
};

const sampleProfileDataLength  = Object.keys(sampleProfileData).length;

var sampleExclusionList1 = ['banner'];
var sampleExclusionList2 = ['banner', 'avatar'];
var sampleExclusionList3 = [];

describe('mbaas', function() {
  describe('#testAuthResponseData', function() {
    it('it should not remove any fields when no exclusion list is specified', function(done) {
      var authResponse = mbaas.trimAuthResponse(sampleProfileData, sampleExclusionList3);
      assert(Object.keys(authResponse).length === sampleProfileDataLength);
      done();
    });
    it('it should remove the password field by default', function(done) {
      var authResponse = mbaas.trimAuthResponse(sampleProfileData, config.authResponseExclusionList);
      assert(authResponse.password === undefined);
      assert(Object.keys(authResponse).length !== sampleProfileDataLength);
      done();
    });
    it('it should remove a single field when specified', function(done) {
      var authResponse = mbaas.trimAuthResponse(sampleProfileData, sampleExclusionList1);
      assert(authResponse.banner === undefined);
      assert(Object.keys(authResponse).length !== sampleProfileDataLength);
      done();
    });
    it('it should remove a number of fields when specified', function(done) {
      var authResponse = mbaas.trimAuthResponse(sampleProfileData, sampleExclusionList2);
      assert(authResponse.banner === undefined);
      assert(authResponse.avatar === undefined);
      assert(Object.keys(authResponse).length !== sampleProfileDataLength);
      done();
    });
  });
});