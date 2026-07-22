// tests/helpers/ai-stub.js
// utils/ai.js is referenced by pages/add/add.js but is not implemented
// in this repo. We install a Module._resolveFilename redirect so any
// `require('../../utils/ai')` (and the bare '.../utils/ai' string) is
// rewritten to a real stub file in tests/helpers. This lets the page
// module load under test without modifying production source files.

const path = require('path');
const Module = require('module');

const STUB_PATH = path.resolve(__dirname, './ai-stub-module.js');
const TARGET_PATTERN = /[/\\]utils[/\\]ai(\.js)?$/;

let installed = false;

function installAiStub() {
  if (installed) return;
  installed = true;
  const orig = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (typeof request === 'string' && TARGET_PATTERN.test(request)) {
      return STUB_PATH;
    }
    return orig.call(this, request, parent, ...rest);
  };
}

module.exports = { installAiStub, STUB_PATH };
