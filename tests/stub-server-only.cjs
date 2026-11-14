/* eslint-disable @typescript-eslint/no-require-imports */
// Lets service modules that import "server-only" run under plain Node for tests.
const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === "server-only") return require.resolve("./empty.cjs");
  return orig.call(this, request, ...rest);
};
