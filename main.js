(function() {

'use strict';

/******************************************************************************/

function getMode(callback) {
  return chrome.storage.local.get({'mode': 'main'}, function(result) {
    console.log(result['mode']);
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

/******************************************************************************/

window.clearContent = function() {
  var content = document.getElementById('content');
  content.innerHTML = '';
  var logger = document.getElementById('log');
  log.innerHTML = '';
}

window.setTitle = function(title) {
  var el = document.getElementById('title');
  el.textContent = title;
}

window.createButton = function(title, callback) {
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

// TODO: make a better logger
window.logger = function() {
  console.log.apply(console, arguments);
  window.medic.log.apply(window.medic.log, arguments);

  var el = document.getElementById('log');
  var div = document.createElement('div');
  div.textContent = Array.prototype.slice.apply(arguments).map(function(arg) {
      return (typeof arg === 'string') ? arg : JSON.stringify(arg);
    }).join(' ');
  el.appendChild(div);
  el.scrollTop = el.scrollHeight;
}

/******************************************************************************/

function runAutoTests() {
  setTitle('Auto Tests');

  createButton('Again', setMode.bind(null, 'auto'));
  createButton('Reset App', chrome.runtime.reload);
  createButton('Back', setMode.bind(null, 'main'));

  window.setUpJasmine();

  var jasmineInterface = window;
  Object.keys(window.tests).forEach(function(key) {
    if (!window.tests[key].enabled)
      return;
    window.tests[key].defineAutoTests(jasmineInterface);
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

document.addEventListener("DOMContentLoaded", function() {
  window.medic.load(function() {
    if (window.medic.enabled) {
      setMode('auto');
    } else {
      getMode(setMode);
    }
  });
});

/******************************************************************************/

}());
