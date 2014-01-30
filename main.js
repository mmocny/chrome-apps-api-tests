(function() {

'use strict';

/******************************************************************************/

// GLOBAL
window.tests = Object.create(null);

window.registerTest = function(name, fn) {
  if (typeof chrome.runtime === 'undefined') {
    eval(require('org.apache.cordova.test-framework.test').injectJasmineInterface(this, 'this'));
    exports.init = fn;
  } else {
    window.tests[name] = { defineAutoTests: fn };
  }
};

/******************************************************************************/

window.medic = {};
window.medic.logurl='http://127.0.0.1:7800';
window.medic.enabled=false;
window.medic.load = function (callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "medic.json", true);
    xhr.onload = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
        var cfg = JSON.parse(xhr.responseText);
        window.medic.logurl = cfg.logurl;
        window.medic.enabled=true;
        console.log('Loaded Medic Config: logurl=' + window.medic.logurl);
      }
      callback();
    }
    xhr.onerror = function() {
       callback();
    }
    xhr.send();
}

/******************************************************************************/

function getMode(callback) {
  return chrome.storage.local.get({'mode': 'main'}, function(result) {
    callback(result['mode']);
  });
}

function setMode(mode) {
  var handlers = {
    'main': runMain,
    'auto': runAutoTests,
    'manual': runManualTests
  }
  if (!handlers.hasOwnProperty(mode)) {
    return console.error("Unsopported mode: " + mode);
  }

  chrome.storage.local.set({'mode': mode});
  clearContent();

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

function sendDebug(logmsg){
  if(window.medic.enabled){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", window.medic.logurl, true);
    xhr.setRequestHeader("Content-Type","text/plain");
    xhr.send(logmsg);
  }
}

// TODO: make a better logger
function logger() {
  console.log.apply(console, Array.prototype.slice.apply(arguments));
  sendDebug(Array.prototype.slice.apply(arguments));
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
  jasmineEnv.catchExceptions(false);

  // Set up jasmine interface
  var jasmineInterface = Object.create(null);
  jasmineInterface.jasmine = jasmine;

  // Fill in jasmineInterface with built-ins
  var jasmine_env_functions = ['describe',
                               'xdescribe',
                               'it',
                               'xit',
                               'beforeEach',
                               'afterEach',
                               'expect',
                               'pending',
                               'spyOn',
                               'addCustomEqualityTester',
                               'addMatchers'];

  jasmine_env_functions.forEach(function(fn) {
    jasmineInterface[fn] = jasmineEnv[fn].bind(jasmineEnv);
  });
  jasmineInterface.clock = jasmineEnv.clock;

  // Extend jasmineInterface with custom helpers
  addJasmineHelpers(jasmineInterface);

  // Add Reporters
  jasmineInterface.jsApiReporter = new jasmine.JsApiReporter({ timer: new jasmine.Timer() });
  jasmineEnv.addReporter(jasmineInterface.jsApiReporter);

  jasmineInterface.htmlReporter = new jasmine.HtmlReporter({
    env: jasmineEnv,
    queryString: function() { return null; },
    onRaiseExceptionsClick: function() { },
    getContainer: function() { return document.getElementById('content'); },
    createElement: function() { return document.createElement.apply(document, arguments); },
    createTextNode: function() { return document.createTextNode.apply(document, arguments); },
    timer: new jasmine.Timer()
  });
  jasmineInterface.htmlReporter.initialize();
  jasmineEnv.addReporter(jasmineInterface.htmlReporter);

  jasmineRequire.medic(jasmine);
  jasmineInterface.MedicReporter = new jasmine.MedicReporter({
    env: jasmineEnv,
    log: { logurl: window.medic.logurl }
  });
  jasmineInterface.MedicReporter.initialize();
  jasmineEnv.addReporter(jasmineInterface.MedicReporter);

  // Add Spec Filter
  jasmineEnv.specFilter = function(spec) {
    logger(spec.getFullName());
    return true;
  };

  // Attach jasmineInterface to global object
  var target = window;
  for (var property in jasmineInterface) {
    target[property] = jasmineInterface[property];
  }
}

function addJasmineHelpers(jasmineInterface) {
  jasmineInterface.log = logger;

  jasmineInterface.isOnCordova = function() {
    return typeof window.cordova !== 'undefined';
  };

  jasmineInterface.isOnChromeRuntime = function() {
    return typeof window.chrome.runtime !== 'undefined';
  };

  jasmineInterface.describeCordovaOnly = (jasmineInterface.isOnCordova() ? jasmineInterface.describe : function(){});

  jasmineInterface.describeChromeRuntimeOnly = (jasmineInterface.isOnChromeRuntime() ? jasmineInterface.describe : function(){});

  jasmineInterface.itShouldHaveAnEvent = function(obj, eventName) {
    jasmineInterface.it('should have an event called ' + eventName, function() {
      jasmineInterface.expect(obj[eventName]).toEqual(jasmineInterface.jasmine.any(chrome.Event));
    });
  }

  jasmineInterface.itShouldHaveAPropertyOfType = function(obj, propName, typeName) {
    jasmineInterface.it('should have a "' + propName + '" ' + typeName, function() {
      jasmineInterface.expect(typeof obj[propName]).toBe(typeName);
    });
  }
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
  window.medic.load(function() {
    setUpJasmine();
    if (window.medic.enabled) {
      setMode('auto');
    } else {
      getMode(setMode);
    }
  });
}

document.addEventListener("DOMContentLoaded", loaded);

/******************************************************************************/

}());
