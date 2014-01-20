function registerTest(name, fn){

if (typeof cordova !== 'undefined') {
  eval(require('org.apache.cordova.test-framework.test').injectJasmineInterface(this, 'this'));
  exports.init = fn;
} else {
  var testobj={};
  testobj.defineAutoTests=fn;
  tests[name] = testobj;
}

};

