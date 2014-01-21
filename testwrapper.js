function registerTest(name, fn) {
  if (typeof chrome.runtime === 'undefined') {
    eval(require('org.apache.cordova.test-framework.test').injectJasmineInterface(this, 'this'));
    exports.init = fn;
  } else {
    tests[name] = { defineAutoTests: fn };
  }
};
