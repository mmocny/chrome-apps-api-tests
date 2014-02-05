(function() {

'use strict';

var exports = window;

exports.tests = Object.create(null);

exports.registerAutoTests = function(name, fn) {
  window.tests[name] = {
    defineAutoTests: function(jasmineInterface) {
      jasmineInterface.describe(name + ' >>', fn);
    },
    enabled: true
  };
};

}());
