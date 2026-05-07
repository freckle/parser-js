import { identity } from 'lodash';
import { Parser } from './index.js';
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
export function parseExpect(expected, value, parser) {
    function die(error) {
        if (verbose) {
            console.log(error);
        }
        // Extra newline defeats jest's dumb error formatting
        throw new Error(`\n${error}`);
    }
    expect(Parser.runInternal(value, parser, identity, die)).toEqual(expected);
}
// Expect parse to succeed
export function parseSuccess(value, parser) {
    expect(Parser.runInternal(value, parser, expectSuccess(true), expectFailure(false))).toEqual(true);
}
// Expect parse to fail
export function parseFailure(value, parser) {
    expect(Parser.runInternal(value, parser, expectSuccess(false), expectFailure(true))).toEqual(true);
}
