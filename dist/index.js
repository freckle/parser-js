"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.obfuscated = exports.map = exports.mapStatic = exports.merge = exports.stringMap = exports.record = exports.field = exports.fields = exports.firstOf = exports.oneOf = exports.stringEnum = exports.date = exports.nonEmptyArray = exports.array = exports.nullableDefined = exports.nullable = exports.nullableDefault = exports.boolean = exports.fixed = exports.rounded = exports.number = exports.stringInt = exports.string = exports.any = exports.pure = exports.typeOf = exports.literal = exports.onSelf = exports.tag = exports.parseFailure = exports.parseSuccess = exports.parseExpect = exports.saferStringify = void 0;
const reduce_1 = __importDefault(require("lodash/reduce"));
const map_1 = __importDefault(require("lodash/map")); // Underscored to avoid name clash
const find_1 = __importDefault(require("lodash/find"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const non_empty_1 = require("@freckle/non-empty");
const path_1 = __importDefault(require("./path"));
const either_1 = __importDefault(require("./either"));
const formatting_1 = require("./formatting");
var formatting_2 = require("./formatting");
Object.defineProperty(exports, "saferStringify", { enumerable: true, get: function () { return formatting_2.saferStringify; } });
var test_helper_1 = require("./test-helper");
Object.defineProperty(exports, "parseExpect", { enumerable: true, get: function () { return test_helper_1.parseExpect; } });
Object.defineProperty(exports, "parseSuccess", { enumerable: true, get: function () { return test_helper_1.parseSuccess; } });
Object.defineProperty(exports, "parseFailure", { enumerable: true, get: function () { return test_helper_1.parseFailure; } });
function propagate(level, next) {
    if (next.tag === 'context' && next.level === 'fatal') {
        return 'fatal';
    }
    return level || 'recoverable';
}
function stringify(a) {
    return typeof a === 'string' ? JSON.stringify(a) : a.toString();
}
function tag(value) {
    const expected = `tag(${stringify(value)})`;
    return {
        type: 'tag',
        expected,
        parse: x => {
            return x === value ? exports.Parser.ok(x) : exports.Parser.fail({ expected, got: x });
        }
    };
}
exports.tag = tag;
function onSelf(parser) {
    const { parse } = parser;
    const expected = `onSelf(${parser.expected})`;
    return {
        type: 'self',
        expected,
        parse
    };
}
exports.onSelf = onSelf;
// Parser that uses equality to decode a literal value
//
// Prefer using tag when the literal is used in a discriminated union
function literal(value) {
    const expected = `literal(${stringify(value)})`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            return x === value ? exports.Parser.ok(x) : exports.Parser.fail({ expected, got: x });
        }
    };
}
exports.literal = literal;
// Parser that uses `typeof`
function typeOf(ty) {
    const expected = `typeOf(${stringify(ty)})`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            return typeof x === ty ? exports.Parser.ok(x) : exports.Parser.fail({ expected, got: x });
        }
    };
}
exports.typeOf = typeOf;
// Lift a pure value into a ParserT
function pure(a) {
    const expected = `pure(${stringify(a)})`;
    return {
        type: 'parser',
        expected,
        parse: _ => exports.Parser.ok(a)
    };
}
exports.pure = pure;
// Parser for any
function any() {
    return {
        type: 'parser',
        expected: 'any()',
        parse: exports.Parser.ok
    };
}
exports.any = any;
// Parser for strings
function string() {
    return typeOf('string');
}
exports.string = string;
// Parser for int as a string
function stringInt() {
    const expected = 'stringInt()';
    return {
        type: 'parser',
        expected,
        parse: x => {
            const mInt = parseInt(x, 10);
            return isNaN(mInt) ? exports.Parser.fail({ expected, got: x }) : exports.Parser.ok(mInt);
        }
    };
}
exports.stringInt = stringInt;
// Parser for numbers
function number() {
    return typeOf('number');
}
exports.number = number;
// Parser for rounded numbers
function rounded() {
    return exports.Parser.map(number(), 'round', x => Math.round(x));
}
exports.rounded = rounded;
// Parser for fixed numbers
function fixed(digits) {
    return exports.Parser.map(number(), 'fixed', x => parseFloat(x.toFixed(digits)));
}
exports.fixed = fixed;
// Parser for booleans
function boolean() {
    return typeOf('boolean');
}
exports.boolean = boolean;
// Build parser that returns a default when encountering null or undefined
function withDefault(parser, def, expected) {
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (x === null || x === undefined) {
                return exports.Parser.ok(def);
            }
            return exports.Parser.context({ expected }, parser.parse(x, path));
        }
    };
}
// Parser for nullable values with a default
function nullableDefault(parser, def) {
    const expected = `nullableDefault(${parser.expected}, ${stringify(def)})`;
    return withDefault(parser, def, expected);
}
exports.nullableDefault = nullableDefault;
// Parser for nullable values
function nullable(parser) {
    const expected = `nullable(${parser.expected})`;
    return withDefault(parser, null, expected);
}
exports.nullable = nullable;
// Parser for nullable values that are never undefined after parsing
function nullableDefined(parser) {
    const expected = `nullableDefined(${parser.expected})`;
    return withDefault(parser, null, expected);
}
exports.nullableDefined = nullableDefined;
function collect(parser, xs, args) {
    const { path, expected } = args;
    // Intentionally using mutation below
    return (0, reduce_1.default)(xs, (acc, x, i) => {
        return either_1.default.liftA2((result, parsed) => {
            result[i] = parsed;
            return result;
        }, () => acc, () => {
            const element = path_1.default.index(path, i);
            const parsed = parser.parse(x, element);
            return exports.Parser.context({ element, expected, input: xs }, parsed);
        });
    }, exports.Parser.ok(new Array(xs.length)));
}
// Parser for arrays
function array(parser) {
    const expected = `array(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (xs, path) => {
            if (!Array.isArray(xs)) {
                return exports.Parser.fail({ expected, got: xs });
            }
            return collect(parser, xs, { path, expected });
        }
    };
}
exports.array = array;
// Parser for non-empty arrays
function nonEmptyArray(parser) {
    const expected = `nonEmptyArray(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (xs, path) => {
            if (!Array.isArray(xs) || xs.length === 0) {
                return exports.Parser.fail({ expected, got: xs });
            }
            return collect(parser, xs, { path, expected });
        }
    };
}
exports.nonEmptyArray = nonEmptyArray;
// Parser for dates represented as moments
function date() {
    const expected = 'date()';
    return {
        type: 'parser',
        expected,
        parse: x => {
            if (typeof x !== 'string') {
                return exports.Parser.fail({ expected, got: x });
            }
            const parsed = (0, moment_timezone_1.default)(x);
            if (!parsed.isValid()) {
                return exports.Parser.fail({ expected, got: x });
            }
            return exports.Parser.ok(parsed);
        }
    };
}
exports.date = date;
// Parser for enums given a parsing function
function stringEnum(name, parse) {
    // Ignore parse function in expected since name should be enough to
    // identify Parser
    const expected = `stringEnum(${stringify(name)}, _)`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            if (typeof x !== 'string') {
                return exports.Parser.fail({ expected: name, got: x });
            }
            const parsed = parse(x);
            if (parsed === null || parsed === undefined) {
                return exports.Parser.fail({ expected: name, got: x });
            }
            return exports.Parser.ok(parsed);
        }
    };
}
exports.stringEnum = stringEnum;
// Simple parser for string enumerations
//
// For example:
// > type MyType = 'foo' | 'bar' | 'baz'
// > oneOf('MyType', ['foo', 'bar', 'baz'])
//
function oneOf(name, all) {
    return stringEnum(name, (text) => (0, find_1.default)(all, value => value === text));
}
exports.oneOf = oneOf;
// Parser that succeeds if any of its arguments succeeds
//
// Fatal errors do short circuit. Currently, these are only produced by using the
// special tag() parser which allows committing early inside record()
function firstOf(first, ...rest) {
    const expecteds = (0, map_1.default)([first, ...rest], parser => parser.expected);
    const expected = `firstOf(${expecteds.join(', ')})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            return (0, reduce_1.default)(rest, (lhs, parser) => {
                if (exports.Parser.isFatal(lhs)) {
                    return lhs;
                }
                return either_1.default.alt(() => lhs, () => parser.parse(x, path));
            }, first.parse(x, path));
        }
    };
}
exports.firstOf = firstOf;
// Parser for selecting different fields than the output field. Fields are tried in order
//
// e.g. The following selects the 'id' or 'ID' field but writes it to the 'uuid' field in the output
//
//   record({uuid: fields(string(), 'id', 'ID')})
//
function fields(parser, first, ...rest) {
    const { expected, parse } = parser;
    const fields = (0, non_empty_1.mkNonEmptyFromHead)(first, rest);
    const expectedFields = (0, map_1.default)(fields, field => stringify(field)).join(', ');
    const prefix = rest.length === 0 ? 'field' : 'fields';
    return {
        type: 'renamer',
        fields,
        expected: `${prefix}(${expected}, ${expectedFields})`,
        parse
    };
}
exports.fields = fields;
// Convenient alias for fields when given a single field
//
// e.g. The following selects the 'id' field but writes it to the 'uuid' field in the output
//
//   record({uuid: field('id', string())})
//
function field(parser, field) {
    return fields(parser, field);
}
exports.field = field;
function extractTagParser(parsers) {
    let result = null;
    for (const [key, parser] of Object.entries(parsers)) {
        if (parser.type === 'tag') {
            if (result !== null) {
                throw new Error(`Cannot have multiple tag parsers in a single record; first - ${result.key}, second - ${key}`);
            }
            result = { key, parser };
        }
    }
    return result;
}
// Parser for records where each key has its own parser
function record(parsers) {
    const keys = Object.keys(parsers).sort();
    const pairs = (0, map_1.default)(keys, key => `${key}: ${parsers[key].expected}`);
    const expected = `record({${pairs.join(', ')}})`;
    const extracted = extractTagParser(parsers);
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (typeof x !== 'object' || x === null) {
                return exports.Parser.fail({ expected, got: x });
            }
            // If we have a tag, we can fail early. However, if we find the
            // tag, any further failures are fatal. Specifically, firstOf()
            // will quit trying any remaining parsers
            let shouldCommit = false;
            if (extracted !== null) {
                const { key, parser } = extracted;
                const value = x[key];
                if (value === undefined) {
                    return exports.Parser.fail({ expected: `object with tag at key "${key}"`, got: x });
                }
                const result = parser.parse(value, path);
                if (result.tag === 'right') {
                    shouldCommit = true;
                }
                else {
                    return exports.Parser.context({ element: path_1.default.key(path, key), expected, input: x }, result);
                }
            }
            const parseOne = (parser, key, field) => {
                if (parser.type === 'self') {
                    const parsed = parser.parse(x, path);
                    return exports.Parser.context({ element: path, expected, input: x }, parsed);
                }
                else {
                    const element = path_1.default.key(path, key);
                    const parsed = parser.parse(x[field], path_1.default.key(path, field));
                    return exports.Parser.context({ element, expected, input: x }, parsed);
                }
            };
            // Intentionally using mutation below
            const result = (0, reduce_1.default)(keys, (acc, key) => {
                return either_1.default.liftA2((result, parsed) => (Object.assign(Object.assign({}, result), { [key]: parsed })), () => acc, () => {
                    const parser = parsers[key];
                    const [first, rest] = parser.type === 'renamer' ? (0, non_empty_1.unconsOnNonEmpty)(parser.fields) : [key, []];
                    return (0, reduce_1.default)(rest, (parsed, field) => either_1.default.alt(() => parsed, () => parseOne(parser, key, field)), parseOne(parser, first, first));
                });
            }, exports.Parser.ok({}));
            // Commit if we found a specific tag
            return shouldCommit ? exports.Parser.commit(result) : result;
        }
    };
}
exports.record = record;
// Parser for records with arbitrary string keys, but homogenous values
function stringMap(parser) {
    const expected = `stringMap(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (typeof x !== 'object' || x === null) {
                return exports.Parser.fail({ expected, got: x });
            }
            // Intentionally using mutation below
            return (0, reduce_1.default)(Object.keys(x), (acc, key) => {
                return either_1.default.liftA2((result, value) => {
                    result.set(key, value);
                    return result;
                }, () => acc, () => {
                    const element = path_1.default.key(path, key);
                    const parsed = parser.parse(x[key], element);
                    return exports.Parser.context({ element, expected, input: x }, parsed);
                });
            }, exports.Parser.ok(new Map()));
        }
    };
}
exports.stringMap = stringMap;
// Merge two record parsers to parse one object with the union of their keys
function merge(lhs, rhs) {
    const expected = `merge(${lhs.expected}, ${rhs.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            return either_1.default.liftA2((lhs, rhs) => (Object.assign(Object.assign({}, lhs), rhs)), () => exports.Parser.context({ expected, input: x }, lhs.parse(x, path)), () => exports.Parser.context({ expected, input: x }, rhs.parse(x, path)));
        }
    };
}
exports.merge = merge;
// Apply a function to the result of a parser if it succeeds
//
// Uses the function's name as part of the expected value, so only use
// this for functions that are known to have a non-empty name property.
// Falls back to toString() which is sketchy as hell.
//
function mapStatic(parser, f) {
    const expected = `mapStatic(${parser.expected}, ${f.name || f.toString()})`;
    return mapInternal(parser, expected, f);
}
exports.mapStatic = mapStatic;
// Apply a function to the result of a parser if it succeeds
//
// Second argument should adequately identify the function's behavior
// so it can be used in the expected value, which can then be used
// to compare Parsers for rough equality.
//
function map(parser, name, f) {
    const expected = `map(${parser.expected}, ${name}, _)`;
    return mapInternal(parser, expected, f);
}
exports.map = map;
function mapInternal(parser, expected, f) {
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            const parsed = parser.parse(x, path);
            return either_1.default.map(f, exports.Parser.context({ expected }, parsed));
        }
    };
}
// Unobfuscate the response and make sure it follow the expected format
function obfuscated(parser) {
    const expected = `obfuscated(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => either_1.default.bind(string().parse(x, path), s => {
            let unObfuscated;
            try {
                unObfuscated = JSON.parse(b64DecodeUnicode(s));
            }
            catch (e) {
                return exports.Parser.fail({ expected, got: s });
            }
            return parser.parse(unObfuscated, path);
        })
    };
}
exports.obfuscated = obfuscated;
exports.Parser = {
    // Smart constructor for a successful parse
    ok(result) {
        return either_1.default.pure(result);
    },
    // Smart constructor for a failure at the leaf level
    fail(obj) {
        return either_1.default.fail(Object.assign({ tag: 'fail' }, obj));
    },
    // Mark failure fatal
    commit(parsed) {
        return either_1.default.bimap(error => {
            if (error.tag === 'context') {
                return Object.assign(Object.assign({}, error), { level: 'fatal' });
            }
            return error;
        }, x => x, parsed);
    },
    // Check if a failure is failure
    isFatal(parsed) {
        return parsed.tag === 'left' && parsed.left.tag === 'context' && parsed.left.level === 'fatal';
    },
    // Add context to an existing parse result if it already
    // represents a failure
    //
    // The following pieces of context can be supplied
    //    input - the value being parsed
    //    element - path to the element in the input being scrutinized
    //    expected - representation of an input that would successfully parse
    context(args, parsed) {
        const { input, level, element, expected } = args;
        return either_1.default.bimap(next => ({
            tag: 'context',
            level: propagate(level, next),
            element: element || path_1.default.skip(),
            expected,
            input,
            next
        }), x => x, parsed);
    },
    // Re-export under Parser
    typeOf,
    literal,
    string,
    stringInt,
    number,
    rounded,
    fixed,
    boolean,
    nullable,
    nullableDefault,
    nullableDefined,
    array,
    nonEmptyArray,
    date,
    stringEnum,
    firstOf,
    tag,
    field,
    fields,
    record,
    stringMap,
    merge,
    map,
    mapStatic,
    // Exported for testing
    runInternal(value, parser, onSuccess, onError) {
        return either_1.default.match(parser.parse(value, path_1.default.root()), {
            left: err => onError((0, formatting_1.formatError)(err)),
            right: result => onSuccess(result)
        });
    },
    // Run a parser on an input. Throws an exception if the parser fails
    run(value, parser) {
        return exports.Parser.runInternal(value, parser, result => result, error => {
            console.log(error);
            throw new Error(error);
        });
    },
    // Make a run function that partially applies `parser`
    mkRun(parser) {
        return (value) => exports.Parser.run(value, parser);
    }
};
// Taken from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_4_%E2%80%93_escaping_the_string_before_encoding_it
function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str)
        .split('')
        .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''));
}
