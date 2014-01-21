(function() {

'use strict';

/******************************************************************************/

// GLOBAL
window.tests = {};

/******************************************************************************/

function getMode() {
  return localStorage['mode'] || 'main';
}

function setMode(mode) {
  localStorage['mode'] = mode;
  clearContent();

  var handlers = {
    'main': runMain,
    'auto': runAutoTests,
    'manual': runManualTests
  }
  if (!handlers.hasOwnProperty(mode)) {
    return console.error("Unsopported mode: " + mode);
  }

  handlers[mode]();
}

function clearContent() {
  var content = document.getElementById('content');
  //while (content.firstChild) content.removeChild(content.firstChild);
  // TODO
}

function setTitle(title) {
  var el = document.getElementById('title');
  el.textContent = title;
}

function createButton(title, callback) {
  var content = document.getElementById('content');
  var div = document.createElement('div');
  var button = document.createElement('a');
  button.textContent = title;
  button.onclick = function(e) {
    e.preventDefault();
    callback();
  };
  button.classList.add('topcoat-button');
  div.appendChild(button);
  content.appendChild(div);
}

function logger() {
  console.log.apply(console, Array.prototype.slice.apply(arguments));
  var el = document.getElementById('log');
  var div = document.createElement('div');
  div.textContent = Array.prototype.slice.apply(arguments).map(function(arg) {
      return (typeof arg === 'string') ? arg : JSON.stringify(arg);
    }).join(' ');
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

/******************************************************************************/

function setUpJasmine() {
  // Set up jasmine
  var jasmine = jasmineRequire.core(jasmineRequire);
  jasmineRequire.html(jasmine);
  var jasmineEnv = jasmine.getEnv();

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 300;
  jasmineEnv.catchExceptions(true);

  createHtmlReporter(jasmine);

  // Set up jasmine interface
  var jasmineInterface = {
    it: function(desc, func) {
      return jasmineEnv.it(desc, func);
    },

    xit: function(desc, func) {
      return jasmineEnv.xit(desc, func);
    },

    beforeEach: function(beforeEachFunction) {
      return jasmineEnv.beforeEach(beforeEachFunction);
    },

    afterEach: function(afterEachFunction) {
      return jasmineEnv.afterEach(afterEachFunction);
    },

    expect: function(actual) {
      return jasmineEnv.expect(actual);
    },

    pending: function() {
      return jasmineEnv.pending();
    },

    addMatchers: function(matchers) {
      return jasmineEnv.addMatchers(matchers);
    },

    spyOn: function(obj, methodName) {
      return jasmineEnv.spyOn(obj, methodName);
    },

    clock: jasmineEnv.clock,

    jsApiReporter: new jasmine.JsApiReporter({
      timer: new jasmine.Timer()
    }),

    jasmine: jasmine,

    log: logger,

    isOnCordova: function() {
      return false;
    },

    isOnChromeRuntime: function() {
      return true;
    },

    describeCordovaOnly: function() {
      if (!isOnCordova()) return;
      describe.apply(null, arguments);
    },

    describeChromeRuntimeOnly: function() {
     if (!isOnChromeRuntime()) return;
     describe.apply(null, arguments);
    },
  };
  ['describe', 'xdescribe'].forEach(function(method) {
    jasmineInterface[method] = jasmineEnv[method].bind(jasmineEnv);
  });

  jasmineEnv.addReporter(jasmineInterface.jsApiReporter);

  jasmineInterface['itShouldHaveAnEvent']=function(obj, eventName) {
    it('should have an event called ' + eventName, function() {
      expect(obj[eventName]).toEqual(jasmine.any(chrome.Event));
    });
  }

  jasmineInterface['itShouldHaveAPropertyOfType']=function(obj, propName, typeName) {
    it('should have a "' + propName + '" ' + typeName, function() {
      expect(typeof obj[propName]).toBe(typeName);
    });
  }

  var target = window;
  for (var property in jasmineInterface) {
    target[property] = jasmineInterface[property];
  }
}

function createHtmlReporter(jasmine) {
   // Set up jasmine html reporter
  var jasmineEnv = jasmine.getEnv();
  var contentEl = document.getElementById('content');
  var htmlReporter = new jasmine.HtmlReporter({
    env: jasmineEnv,
    queryString: function() { return null },
    onRaiseExceptionsClick: function() { /*queryString.setParam("catch", !jasmineEnv.catchingExceptions());*/ },
    getContainer: function() { return contentEl; },
    createElement: function() { return document.createElement.apply(document, arguments); },
    createTextNode: function() { return document.createTextNode.apply(document, arguments); },
    timer: new jasmine.Timer()
  });
  htmlReporter.initialize();

  jasmineEnv.addReporter(htmlReporter);
}

/******************************************************************************/

function runAutoTests() {
  setTitle('Auto Tests');
  createButton('Back', setMode.bind(null, 'main'));

  // TODO: Add selective checkmarks
  Object.keys(window.tests).forEach(function(key) {
    window.tests[key].defineAutoTests();
  });

  // Run the tests!
  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.execute();
}

/******************************************************************************/

function runManualTests() {
  setTitle('Manual Tests');
  createButton('Back', setMode.bind(null, 'main'));
}

/******************************************************************************/

function runMain() {
  setTitle('Chrome Apps Api Tests');

  createButton('Auto Tests', setMode.bind(null, 'auto'));
  createButton('Manual Tests', setMode.bind(null, 'manual'));
  createButton('Reset App', chrome.runtime.reload);
}

/******************************************************************************/

function loaded() {
  setUpJasmine();
  setMode(getMode());
}

document.addEventListener("DOMContentLoaded", loaded);

/******************************************************************************/

}());
