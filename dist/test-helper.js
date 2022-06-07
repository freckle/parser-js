"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFailure = exports.parseSuccess = exports.parseExpect = void 0;
const identity_1 = __importDefault(require("lodash/identity"));
const _1 = require(".");
// Set true to see parse results
const verbose = false;
function expectSuccess(expected) {
    return result => {
        if (verbose || !expected) {
            const message = expected ? 'Expected success' : 'Unexpected success';
            console.log(`${message}: ${JSON.stringify(result)}`);
        }
        return expected;
    };
}
function expectFailure(expected) {
    return error => {
        if (verbose || !expected) {
            const message = expected ? 'Expected failure' : 'Unexpected failure';
            console.log(`${message}:\n${error}`);
        }
        return expected;
    };
}
// Expect parse to succeed and return specified value
function parseExpect(expected, value, parser) {
    function die(error) {
        if (verbose) {
            console.log(error);
        }
        // Extra newline defeats jest's dumb error formatting
        throw new Error(`\n${error}`);
    }
    expect(_1.Parser.runInternal(value, parser, identity_1.default, die)).toEqual(expected);
}
exports.parseExpect = parseExpect;
// Expect parse to succeed
function parseSuccess(value, parser) {
    expect(_1.Parser.runInternal(value, parser, expectSuccess(true), expectFailure(false))).toEqual(true);
}
exports.parseSuccess = parseSuccess;
// Expect parse to fail
function parseFailure(value, parser) {
    expect(_1.Parser.runInternal(value, parser, expectSuccess(false), expectFailure(true))).toEqual(true);
}
exports.parseFailure = parseFailure;
