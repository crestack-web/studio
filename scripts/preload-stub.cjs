const Module = require('module');
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === 'server-only') return require.resolve('./server-only-stub.cjs');
  return orig.call(this, request, ...args);
};
