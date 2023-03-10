"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saferStringify = exports.formatError = void 0;
const times_1 = __importDefault(require("lodash/times"));
const maybe_1 = require("@freckle/maybe");
const exhaustive_1 = require("@freckle/exhaustive");
const path_1 = __importDefault(require("./path"));
// Format an ErrorStackT into a human-readable message
//
// For example, the following ErrorStackT:
//
//   > {
//   >   tag: 'context',
//   >   expected: 'Array<number>',
//   >   child: [{tag: 'index', index: 1}],
//   >   context: [1, true, {x: 10}, null],
//   >   next: {
//   >     tag: 'fail',
//   >     expected: 'number',
//   >     got: true
//   >   }
//   > }
//
// Is formatted as follows:
//
//   > expected
//   >
//   >   number
//   >
//   > but got
//   >
//   >   true: boolean
//   >
//   > at key path 1 of
//   >
//   >   Array<number>
//   >
//   > specifically
//   >
//   >   [1,true,{"x":10},null]
//   >
//   > of type
//   >
//   >   Array<number | boolean | ...>
//
// The top of the error message applies to the deepest part of the
// data structure. Further down, we provide more context about where
// the error occurred.
function formatError(root) {
    function walk(node, lines) {
        switch (node.tag) {
            case 'fail': {
                const { expected, got } = node;
                return [
                    'expected',
                    '',
                    indent(2, expected),
                    '',
                    'but got',
                    '',
                    ...formatWithType(got),
                    ...lines
                ];
            }
            case 'context': {
                const { expected, element, input, next } = node;
                const path = path_1.default.join(element);
                const where = path === null || path === undefined ? 'in' : `at key path ${path} of`;
                const example = input === null || input === undefined
                    ? []
                    : ['', 'specifically', '', ...formatWithType(input)];
                const newLines = ['', where, '', indent(2, expected), ...example];
                return walk(next, [...newLines, ...lines]);
            }
            default:
                return (0, exhaustive_1.exhaustive)(node, 'ErrorStackT');
        }
    }
    return walk(root, []).join('\n');
}
exports.formatError = formatError;
function formatWithType(root) {
    return [indent(2, saferStringify(root)), ...formatType(root)];
}
function formatType(root) {
    const ty = typeofDeep(root);
    // These types are self-evident, don't print them
    return ty === 'undefined' || ty === 'null' || ty === '{}'
        ? []
        : ['', 'of type', '', indent(2, ty)];
}
// Like typeof but recursive one Objects and Arrays
function typeofDeep(root, maxDepth = 20) {
    function walk(node, depth) {
        if (depth >= maxDepth) {
            return '...';
        }
        const basicType = typeof node;
        if (basicType !== 'object') {
            return basicType;
        }
        if (node === null) {
            return 'null';
        }
        if (Array.isArray(node)) {
            if (node.length === 0) {
                return 'Array<?>';
            }
            else {
                const firstTy = walk(node[0], depth + 1);
                let nextTy = null;
                // Looking for non-uniformity
                for (let i = 1; i < node.length; ++i) {
                    const ty = walk(node[i], depth + 1);
                    if (ty !== firstTy) {
                        nextTy = ty;
                        break;
                    }
                }
                if (nextTy === null) {
                    return `Array<${firstTy}>`;
                }
                else {
                    return `Array<${firstTy} | ${nextTy} | ...>`;
                }
            }
        }
        const pairs = (0, maybe_1.mapMaybes)(Object.keys(node), key => 
        // eslint-disable-next-line no-prototype-builtins
        node.hasOwnProperty(key) ? `${key}: ${walk(node[key], depth + 1)}` : null);
        return `{${pairs.join(', ')}}`;
    }
    return walk(root, 0);
}
// JSON.stringify ignores undefined and throws on circular objects
function saferStringify(root) {
    if (root === undefined) {
        return 'undefined';
    }
    try {
        return JSON.stringify(root);
    }
    catch (e) {
        if (e instanceof TypeError) {
            return '{...Circular object or BigInt...}';
        }
        throw e;
    }
}
exports.saferStringify = saferStringify;
// Indent string n spaces
function indent(n, text) {
    return `${(0, times_1.default)(n, () => ' ').join('')}${text}`;
}
