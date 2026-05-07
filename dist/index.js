import { reduce, map as _map, find } from 'lodash';
import moment from 'moment-timezone';
import { mkNonEmpty, mkNonEmptyFromHead, unconsOnNonEmpty } from '@freckle/non-empty';
import Path from './path.js';
import Either from './either.js';
import { formatError } from './formatting.js';
export { saferStringify } from './formatting.js';
export { parseExpect, parseSuccess, parseFailure } from './test-helper.js';
function propagate(level, next) {
    if (next.tag === 'context' && next.level === 'fatal') {
        return 'fatal';
    }
    return level || 'recoverable';
}
function stringify(a) {
    return typeof a === 'string' ? JSON.stringify(a) : a.toString();
}
export function tag(value) {
    const expected = `tag(${stringify(value)})`;
    return {
        type: 'tag',
        expected,
        parse: x => {
            return x === value ? Parser.ok(x) : Parser.fail({ expected, got: x });
        }
    };
}
export function onSelf(parser) {
    const { parse } = parser;
    const expected = `onSelf(${parser.expected})`;
    return {
        type: 'self',
        expected,
        parse
    };
}
// Parser that uses equality to decode a literal value
//
// Prefer using tag when the literal is used in a discriminated union
export function literal(value) {
    const expected = `literal(${stringify(value)})`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            return x === value ? Parser.ok(x) : Parser.fail({ expected, got: x });
        }
    };
}
// Parser that uses `typeof`
export function typeOf(ty) {
    const expected = `typeOf(${stringify(ty)})`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            return typeof x === ty ? Parser.ok(x) : Parser.fail({ expected, got: x });
        }
    };
}
// Lift a pure value into a ParserT
export function pure(a) {
    const expected = `pure(${stringify(a)})`;
    return {
        type: 'parser',
        expected,
        parse: _ => Parser.ok(a)
    };
}
// Parser for any
export function any() {
    return {
        type: 'parser',
        expected: 'any()',
        parse: Parser.ok
    };
}
// Parser for strings
export function string() {
    return typeOf('string');
}
// Parser for int as a string
export function stringInt() {
    const expected = 'stringInt()';
    return {
        type: 'parser',
        expected,
        parse: x => {
            const mInt = parseInt(x, 10);
            return isNaN(mInt) ? Parser.fail({ expected, got: x }) : Parser.ok(mInt);
        }
    };
}
// Parser for numbers
export function number() {
    return typeOf('number');
}
// Parser for rounded numbers
export function rounded() {
    return Parser.map(number(), 'round', x => Math.round(x));
}
// Parser for fixed numbers
export function fixed(digits) {
    return Parser.map(number(), 'fixed', x => parseFloat(x.toFixed(digits)));
}
// Parser for booleans
export function boolean() {
    return typeOf('boolean');
}
// Build parser that returns a default when encountering null or undefined
function withDefault(parser, def, expected) {
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (x === null || x === undefined) {
                return Parser.ok(def);
            }
            return Parser.context({ expected }, parser.parse(x, path));
        }
    };
}
// Parser for nullable values with a default
export function nullableDefault(parser, def) {
    const expected = `nullableDefault(${parser.expected}, ${stringify(def)})`;
    return withDefault(parser, def, expected);
}
// Parser for nullable values
export function nullable(parser) {
    const expected = `nullable(${parser.expected})`;
    return withDefault(parser, null, expected);
}
// Parser for nullable values that are never undefined after parsing
export function nullableDefined(parser) {
    const expected = `nullableDefined(${parser.expected})`;
    return withDefault(parser, null, expected);
}
function collect(parser, xs, args) {
    const { path, expected } = args;
    // Intentionally using mutation below
    return reduce(xs, (acc, x, i) => {
        return Either.liftA2((result, parsed) => {
            result[i] = parsed;
            return result;
        }, () => acc, () => {
            const element = Path.index(path, i);
            const parsed = parser.parse(x, element);
            return Parser.context({ element, expected, input: xs }, parsed);
        });
    }, Parser.ok(new Array(xs.length)));
}
// Parser for arrays
export function array(parser) {
    const expected = `array(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (xs, path) => {
            if (!Array.isArray(xs)) {
                return Parser.fail({ expected, got: xs });
            }
            return collect(parser, xs, { path, expected });
        }
    };
}
// Parser for non-empty arrays
export function nonEmptyArray(parser) {
    const expected = `nonEmptyArray(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (xs, path) => {
            if (!Array.isArray(xs) || xs.length === 0) {
                return Parser.fail({ expected, got: xs });
            }
            const parsed = mkNonEmpty(xs);
            if (parsed === null) {
                return Parser.fail({ expected, got: xs });
            }
            return collect(parser, parsed, { path, expected });
        }
    };
}
// Parser for dates represented as moments
export function date() {
    const expected = 'date()';
    return {
        type: 'parser',
        expected,
        parse: x => {
            if (typeof x !== 'string') {
                return Parser.fail({ expected, got: x });
            }
            const parsed = moment(x);
            if (!parsed.isValid()) {
                return Parser.fail({ expected, got: x });
            }
            return Parser.ok(parsed);
        }
    };
}
// Parser for enums given a parsing function
export function stringEnum(name, parse) {
    // Ignore parse function in expected since name should be enough to
    // identify Parser
    const expected = `stringEnum(${stringify(name)}, _)`;
    return {
        type: 'parser',
        expected,
        parse: x => {
            if (typeof x !== 'string') {
                return Parser.fail({ expected: name, got: x });
            }
            const parsed = parse(x);
            if (parsed === null || parsed === undefined) {
                return Parser.fail({ expected: name, got: x });
            }
            return Parser.ok(parsed);
        }
    };
}
// Simple parser for string enumerations
//
// For example:
// > type MyType = 'foo' | 'bar' | 'baz'
// > oneOf('MyType', ['foo', 'bar', 'baz'])
//
export function oneOf(name, all) {
    return stringEnum(name, (text) => find(all, value => value === text));
}
// Parser that succeeds if any of its arguments succeeds
//
// Fatal errors do short circuit. Currently, these are only produced by using the
// special tag() parser which allows committing early inside record()
export function firstOf(first, ...rest) {
    const expecteds = _map([first, ...rest], parser => parser.expected);
    const expected = `firstOf(${expecteds.join(', ')})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            return reduce(rest, (lhs, parser) => {
                if (Parser.isFatal(lhs)) {
                    return lhs;
                }
                return Either.alt(() => lhs, () => parser.parse(x, path));
            }, first.parse(x, path));
        }
    };
}
// Parser for selecting different fields than the output field. Fields are tried in order
//
// e.g. The following selects the 'id' or 'ID' field but writes it to the 'uuid' field in the output
//
//   record({uuid: fields(string(), 'id', 'ID')})
//
export function fields(parser, first, ...rest) {
    const { expected, parse } = parser;
    const fields = mkNonEmptyFromHead(first, rest);
    const expectedFields = _map(fields, field => stringify(field)).join(', ');
    const prefix = rest.length === 0 ? 'field' : 'fields';
    return {
        type: 'renamer',
        fields,
        expected: `${prefix}(${expected}, ${expectedFields})`,
        parse
    };
}
// Convenient alias for fields when given a single field
//
// e.g. The following selects the 'id' field but writes it to the 'uuid' field in the output
//
//   record({uuid: field('id', string())})
//
export function field(parser, field) {
    return fields(parser, field);
}
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
export function record(parsers) {
    const keys = Object.keys(parsers).sort();
    const pairs = _map(keys, key => `${key}: ${parsers[key].expected}`);
    const expected = `record({${pairs.join(', ')}})`;
    const extracted = extractTagParser(parsers);
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (typeof x !== 'object' || x === null) {
                return Parser.fail({ expected, got: x });
            }
            // If we have a tag, we can fail early. However, if we find the
            // tag, any further failures are fatal. Specifically, firstOf()
            // will quit trying any remaining parsers
            let shouldCommit = false;
            if (extracted !== null) {
                const { key, parser } = extracted;
                const value = x[key];
                if (value === undefined) {
                    return Parser.fail({ expected: `object with tag at key "${key}"`, got: x });
                }
                const result = parser.parse(value, path);
                if (result.tag === 'right') {
                    shouldCommit = true;
                }
                else {
                    return Parser.context({ element: Path.key(path, key), expected, input: x }, result);
                }
            }
            const parseOne = (parser, key, field) => {
                if (parser.type === 'self') {
                    const parsed = parser.parse(x, path);
                    return Parser.context({ element: path, expected, input: x }, parsed);
                }
                else {
                    const element = Path.key(path, key);
                    const parsed = parser.parse(x[field], Path.key(path, field));
                    return Parser.context({ element, expected, input: x }, parsed);
                }
            };
            // Intentionally using mutation below
            const result = reduce(keys, (acc, key) => {
                return Either.liftA2((result, parsed) => ({
                    ...result,
                    [key]: parsed
                }), () => acc, () => {
                    const parser = parsers[key];
                    const [first, rest] = parser.type === 'renamer' ? unconsOnNonEmpty(parser.fields) : [key, []];
                    return reduce(rest, (parsed, field) => Either.alt(() => parsed, () => parseOne(parser, key, field)), parseOne(parser, first, first));
                });
            }, Parser.ok({}));
            // Commit if we found a specific tag
            return shouldCommit ? Parser.commit(result) : result;
        }
    };
}
// Parser for records with arbitrary string keys, but homogenous values
export function stringMap(parser) {
    const expected = `stringMap(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            if (typeof x !== 'object' || x === null) {
                return Parser.fail({ expected, got: x });
            }
            // Intentionally using mutation below
            return reduce(Object.keys(x), (acc, key) => {
                return Either.liftA2((result, value) => {
                    result.set(key, value);
                    return result;
                }, () => acc, () => {
                    const element = Path.key(path, key);
                    const parsed = parser.parse(x[key], element);
                    return Parser.context({ element, expected, input: x }, parsed);
                });
            }, Parser.ok(new Map()));
        }
    };
}
// Merge two record parsers to parse one object with the union of their keys
export function merge(lhs, rhs) {
    const expected = `merge(${lhs.expected}, ${rhs.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            return Either.liftA2((lhs, rhs) => ({ ...lhs, ...rhs }), () => Parser.context({ expected, input: x }, lhs.parse(x, path)), () => Parser.context({ expected, input: x }, rhs.parse(x, path)));
        }
    };
}
// Apply a function to the result of a parser if it succeeds
//
// Uses the function's name as part of the expected value, so only use
// this for functions that are known to have a non-empty name property.
// Falls back to toString() which is sketchy as hell.
//
export function mapStatic(parser, f) {
    const expected = `mapStatic(${parser.expected}, ${f.name || f.toString()})`;
    return mapInternal(parser, expected, f);
}
// Apply a function to the result of a parser if it succeeds
//
// Second argument should adequately identify the function's behavior
// so it can be used in the expected value, which can then be used
// to compare Parsers for rough equality.
//
export function map(parser, name, f) {
    const expected = `map(${parser.expected}, ${name}, _)`;
    return mapInternal(parser, expected, f);
}
function mapInternal(parser, expected, f) {
    return {
        type: 'parser',
        expected,
        parse: (x, path) => {
            const parsed = parser.parse(x, path);
            return Either.map(f, Parser.context({ expected }, parsed));
        }
    };
}
// Unobfuscate the response and make sure it follow the expected format
export function obfuscated(parser) {
    const expected = `obfuscated(${parser.expected})`;
    return {
        type: 'parser',
        expected,
        parse: (x, path) => Either.bind(string().parse(x, path), s => {
            let unObfuscated;
            try {
                unObfuscated = JSON.parse(b64DecodeUnicode(s));
            }
            catch (e) {
                return Parser.fail({ expected, got: s });
            }
            return parser.parse(unObfuscated, path);
        })
    };
}
export const Parser = {
    // Smart constructor for a successful parse
    ok(result) {
        return Either.pure(result);
    },
    // Smart constructor for a failure at the leaf level
    fail(obj) {
        return Either.fail({ tag: 'fail', ...obj });
    },
    // Mark failure fatal
    commit(parsed) {
        return Either.bimap(error => {
            if (error.tag === 'context') {
                return { ...error, level: 'fatal' };
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
        return Either.bimap(next => ({
            tag: 'context',
            level: propagate(level, next),
            element: element || Path.skip(),
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
        return Either.match(parser.parse(value, Path.root()), {
            left: err => onError(formatError(err)),
            right: result => onSuccess(result)
        });
    },
    // Run a parser on an input. Throws an exception if the parser fails
    run(value, parser) {
        return Parser.runInternal(value, parser, result => result, error => {
            console.log(error);
            throw new Error(error);
        });
    },
    // Make a run function that partially applies `parser`
    mkRun(parser) {
        return (value) => Parser.run(value, parser);
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
