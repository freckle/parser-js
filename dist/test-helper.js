"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseExpect = parseExpect;
exports.parseFailure = parseFailure;
exports.parseSuccess = parseSuccess;

var _identity = _interopRequireDefault(require("lodash/identity"));

var _ = require(".");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Set true to see parse results
var verbose = false;

function expectSuccess(expected) {
  return function (result) {
    if (verbose || !expected) {
      var message = expected ? 'Expected success' : 'Unexpected success';
      console.log("".concat(message, ": ").concat(JSON.stringify(result)));
    }

    return expected;
  };
}

function expectFailure(expected) {
  return function (error) {
    if (verbose || !expected) {
      var message = expected ? 'Expected failure' : 'Unexpected failure';
      console.log("".concat(message, ":\n").concat(error));
    }

    return expected;
  };
} // Expect parse to succeed and return specified value


function parseExpect(expected, value, parser) {
  function die(error) {
    if (verbose) {
      console.log(error);
    } // Extra newline defeats jest's dumb error formatting


    throw new Error("\n".concat(error));
  }

  expect(_.Parser.runInternal(value, parser, _identity["default"], die)).toEqual(expected);
} // Expect parse to succeed


function parseSuccess(value, parser) {
  expect(_.Parser.runInternal(value, parser, expectSuccess(true), expectFailure(false))).toEqual(true);
} // Expect parse to fail


function parseFailure(value, parser) {
  expect(_.Parser.runInternal(value, parser, expectSuccess(false), expectFailure(true))).toEqual(true);
}