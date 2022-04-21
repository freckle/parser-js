"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Parser = void 0;
exports.any = any;
exports.array = array;
exports["boolean"] = _boolean;
exports.date = date;
exports.field = field;
exports.fields = fields;
exports.firstOf = firstOf;
exports.fixed = fixed;
exports.literal = literal;
exports.map = map;
exports.mapStatic = mapStatic;
exports.merge = merge;
exports.nonEmptyArray = nonEmptyArray;
exports.nullable = nullable;
exports.nullableDefault = nullableDefault;
exports.nullableDefined = nullableDefined;
exports.number = number;
exports.obfuscated = obfuscated;
exports.onSelf = onSelf;
exports.oneOf = oneOf;
exports.pure = pure;
exports.record = record;
exports.rounded = rounded;
exports.string = string;
exports.stringEnum = stringEnum;
exports.stringInt = stringInt;
exports.stringMap = stringMap;
exports.tag = tag;
exports.typeOf = typeOf;

var _reduce = _interopRequireDefault(require("lodash/reduce"));

var _map2 = _interopRequireDefault(require("lodash/map"));

var _find = _interopRequireDefault(require("lodash/find"));

var _momentTimezone = _interopRequireDefault(require("moment-timezone"));

var _nonEmptyJs = require("@freckle/non-empty-js");

var _path = _interopRequireDefault(require("./path.js"));

var _either = _interopRequireDefault(require("./either.js"));

var _formatting = require("./formatting.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function propagate(level, next) {
  if (next.tag === 'context' && next.level === 'fatal') {
    return 'fatal';
  }

  return level || 'recoverable';
} // Represent parse failure or success


function stringify(a) {
  return typeof a === 'string' ? JSON.stringify(a) : a.toString();
}

function tag(value) {
  var expected = "tag(".concat(stringify(value), ")");
  return {
    isTag: true,
    expected: expected,
    parse: function parse(x) {
      return x === value ? Parser.ok(x) : Parser.fail({
        expected: expected,
        got: x
      });
    }
  };
}

function onSelf(parser) {
  var parse = parser.parse;
  var expected = "onSelf(".concat(parser.expected, ")");
  return {
    onSelf: true,
    expected: expected,
    parse: parse
  };
} // Parser that uses equality to decode a literal value
//
// Prefer using tag when the literal is used in a discriminated union


function literal(value) {
  var expected = "literal(".concat(stringify(value), ")");
  return {
    expected: expected,
    parse: function parse(x) {
      return x === value ? Parser.ok(x) : Parser.fail({
        expected: expected,
        got: x
      });
    }
  };
} // Parser that uses `typeof`


function typeOf(ty) {
  var expected = "typeOf(".concat(stringify(ty), ")");
  return {
    expected: expected,
    parse: function parse(x) {
      return _typeof(x) === ty ? Parser.ok(x) : Parser.fail({
        expected: expected,
        got: x
      });
    }
  };
} // Lift a pure value into a ParserT


function pure(a) {
  var expected = "pure(".concat(stringify(a), ")");
  return {
    expected: expected,
    parse: function parse(_) {
      return Parser.ok(a);
    }
  };
} // Parser for any


function any() {
  return {
    expected: 'any()',
    parse: Parser.ok
  };
} // Parser for strings


function string() {
  return typeOf('string');
} // Parser for int as a string


function stringInt() {
  var expected = 'stringInt()';
  return {
    expected: expected,
    parse: function parse(x) {
      var mInt = parseInt(x, 10);
      return isNaN(mInt) ? Parser.fail({
        expected: expected,
        got: x
      }) : Parser.ok(mInt);
    }
  };
} // Parser for numbers


function number() {
  return typeOf('number');
} // Parser for rounded numbers


function rounded() {
  return Parser.map(number(), 'round', function (x) {
    return Math.round(x);
  });
} // Parser for fixed numbers


function fixed(digits) {
  return Parser.map(number(), 'fixed', function (x) {
    return parseFloat(x.toFixed(digits));
  });
} // Parser for booleans


function _boolean() {
  return typeOf('boolean');
} // ParserT<R> is equivalent to a ParserT<R | S> that never
// returns values of type S


function weaken(parser) {
  return parser;
} // Build parser that returns a default when encountering null or undefined


function withDefault(parser, def, expected) {
  return {
    expected: expected,
    parse: function parse(x, path) {
      if (x === null || x === undefined) {
        return Parser.ok(def);
      }

      return Parser.context({
        expected: expected
      }, weaken(parser).parse(x, path));
    }
  };
} // Parser for nullable values with a default


function nullableDefault(parser, def) {
  var expected = "nullableDefault(".concat(parser.expected, ", ").concat(stringify(def), ")");
  return withDefault(parser, def, expected);
} // Parser for nullable values


function nullable(parser) {
  var expected = "nullable(".concat(parser.expected, ")");
  return withDefault(parser, null, expected);
} // Parser for nullable values that are never undefined after parsing


function nullableDefined(parser) {
  var expected = "nullableDefined(".concat(parser.expected, ")");
  return withDefault(parser, null, expected);
}

function collect(parser, xs, args) {
  var path = args.path,
      expected = args.expected; // Intentionally using mutation below

  return (0, _reduce["default"])(xs, function (acc, x, i) {
    return _either["default"].liftA2(function (result, parsed) {
      result[i] = parsed;
      return result;
    }, function () {
      return acc;
    }, function () {
      var element = _path["default"].index(path, i);

      var parsed = parser.parse(x, element);
      return Parser.context({
        element: element,
        expected: expected,
        input: xs
      }, parsed);
    });
  }, Parser.ok(new Array(xs.length)));
} // Parser for arrays


function array(parser) {
  var expected = "array(".concat(parser.expected, ")");
  return {
    expected: expected,
    parse: function parse(xs, path) {
      if (!Array.isArray(xs)) {
        return Parser.fail({
          expected: expected,
          got: xs
        });
      }

      return collect(parser, xs, {
        path: path,
        expected: expected
      });
    }
  };
} // Parser for non-empty arrays


function nonEmptyArray(parser) {
  var expected = "nonEmptyArray(".concat(parser.expected, ")");
  return {
    expected: expected,
    parse: function parse(xs, path) {
      if (!Array.isArray(xs) || xs.length === 0) {
        return Parser.fail({
          expected: expected,
          got: xs
        });
      } // flow can't use the test above as evidence that xs is non-empty


      return collect(parser, xs, {
        path: path,
        expected: expected
      });
    }
  };
} // Parser for dates represented as moments


function date() {
  var expected = 'date()';
  return {
    expected: expected,
    parse: function parse(x) {
      if (typeof x !== 'string') {
        return Parser.fail({
          expected: expected,
          got: x
        });
      }

      var parsed = (0, _momentTimezone["default"])(x);

      if (!parsed.isValid()) {
        return Parser.fail({
          expected: expected,
          got: x
        });
      }

      return Parser.ok(parsed);
    }
  };
} // Parser for enums given a parsing function


function stringEnum(name, _parse) {
  // Ignore parse function in expected since name should be enough to
  // identify Parser
  var expected = "stringEnum(".concat(stringify(name), ", _)");
  return {
    expected: expected,
    parse: function parse(x) {
      if (typeof x !== 'string') {
        return Parser.fail({
          expected: name,
          got: x
        });
      }

      var parsed = _parse(x);

      if (parsed === null || parsed === undefined) {
        return Parser.fail({
          expected: name,
          got: x
        });
      }

      return Parser.ok(parsed);
    }
  };
} // Simple parser for string enumerations
//
// For example:
// > type MyType = 'foo' | 'bar' | 'baz'
// > oneOf('MyType', ['foo', 'bar', 'baz'])
//


function oneOf(name, all) {
  return stringEnum(name, function (text) {
    return (0, _find["default"])(all, function (value) {
      return value === text;
    });
  });
} // Parser that succeeds if any of its arguments succeeds
//
// Fatal errors do short circuit. Currently, these are only produced by using the
// special tag() parser which allows committing early inside record()


function firstOf(first) {
  for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }

  var expecteds = (0, _map2["default"])([first].concat(rest), function (parser) {
    return parser.expected;
  });
  var expected = "firstOf(".concat(expecteds.join(', '), ")");
  return {
    expected: expected,
    parse: function parse(x, path) {
      return (0, _reduce["default"])(rest, function (lhs, parser) {
        if (Parser.isFatal(lhs)) {
          return lhs;
        }

        return _either["default"].alt(function () {
          return lhs;
        }, function () {
          return parser.parse(x, path);
        });
      }, first.parse(x, path));
    }
  };
} // Parser for selecting different fields than the output field. Fields are tried in order
//
// e.g. The following selects the 'id' or 'ID' field but writes it to the 'uuid' field in the output
//
//   record({uuid: fields(string(), 'id', 'ID')})
//


function fields(parser, first) {
  var expected = parser.expected,
      parse = parser.parse;

  for (var _len2 = arguments.length, rest = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
    rest[_key2 - 2] = arguments[_key2];
  }

  var fields = (0, _nonEmptyJs.mkNonEmptyFromHead)(first, rest);
  var expectedFields = (0, _map2["default"])(fields, function (field) {
    return stringify(field);
  }).join(', ');
  var prefix = rest.length === 0 ? 'field' : 'fields';
  return {
    fields: fields,
    expected: "".concat(prefix, "(").concat(expected, ", ").concat(expectedFields, ")"),
    parse: parse
  };
} // Convenient alias for fields when given a single field
//
// e.g. The following selects the 'id' field but writes it to the 'uuid' field in the output
//
//   record({uuid: field('id', string())})
//


function field(parser, field) {
  return fields(parser, field);
}

function extractTagParser(parsers) {
  var result = null;

  for (var _i = 0, _Object$entries = Object.entries(parsers); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
        _key3 = _Object$entries$_i[0],
        parser = _Object$entries$_i[1];

    if (parser.isTag === true) {
      if (result !== null) {
        throw new Error("Cannot have multiple tag parsers in a single record; first - ".concat(result.key, ", second - ").concat(_key3));
      }

      result = {
        key: _key3,
        parser: parser
      };
    }
  }

  return result;
} // Parser for records where each key has its own parser


function record(parsers) {
  var keys = Object.keys(parsers).sort();
  var pairs = (0, _map2["default"])(keys, function (key) {
    return "".concat(key, ": ").concat(parsers[key].expected);
  });
  var expected = "record({".concat(pairs.join(', '), "})");
  var extracted = extractTagParser(parsers);
  return {
    expected: expected,
    parse: function parse(x, path) {
      if (_typeof(x) !== 'object' || x === null) {
        return Parser.fail({
          expected: expected,
          got: x
        });
      } // If we have a tag, we can fail early. However, if we find the
      // tag, any further failures are fatal. Specifically, firstOf()
      // will quit trying any remaining parsers


      var shouldCommit = false;

      if (extracted !== null) {
        var _key4 = extracted.key,
            parser = extracted.parser;
        var _value = x[_key4];

        if (_value === undefined) {
          return Parser.fail({
            expected: "object with tag at key \"".concat(_key4, "\""),
            got: x
          });
        }

        var _result = parser.parse(_value, path);

        if (_result.tag === 'right') {
          shouldCommit = true;
        } else {
          return Parser.context({
            element: _path["default"].key(path, _key4),
            expected: expected,
            input: x
          }, _result);
        }
      }

      var parseOne = function parseOne(parser, key, field) {
        if (parser.onSelf === true) {
          var parsed = parser.parse(x, path);
          return Parser.context({
            element: path,
            expected: expected,
            input: x
          }, parsed);
        } else {
          var element = _path["default"].key(path, key);

          var _parsed = parser.parse(x[field], _path["default"].key(path, field));

          return Parser.context({
            element: element,
            expected: expected,
            input: x
          }, _parsed);
        }
      }; // Intentionally using mutation below


      var result = (0, _reduce["default"])(keys, function (acc, key) {
        return _either["default"].liftA2(function (result, parsed) {
          result[key] = parsed;
          return result;
        }, function () {
          return acc;
        }, function () {
          var parser = parsers[key];

          var _ref = parser.fields === undefined || parser.fields === null ? [key, []] : (0, _nonEmptyJs.unconsOnNonEmpty)(parser.fields),
              _ref2 = _slicedToArray(_ref, 2),
              first = _ref2[0],
              rest = _ref2[1];

          return (0, _reduce["default"])(rest, function (parsed, field) {
            return _either["default"].alt(function () {
              return parsed;
            }, function () {
              return parseOne(parser, key, field);
            });
          }, parseOne(parser, first, first));
        });
      }, Parser.ok({})); // Commit if we found a specific tag

      return shouldCommit ? Parser.commit(result) : result;
    }
  };
} // Parser for records with arbitrary string keys, but homogenous values


function stringMap(parser) {
  var expected = "stringMap(".concat(parser.expected, ")");
  return {
    expected: expected,
    parse: function parse(x, path) {
      if (_typeof(x) !== 'object' || x === null) {
        return Parser.fail({
          expected: expected,
          got: x
        });
      } // Intentionally using mutation below


      return (0, _reduce["default"])(Object.keys(x), function (acc, key) {
        return _either["default"].liftA2(function (result, value) {
          result.set(key, value);
          return result;
        }, function () {
          return acc;
        }, function () {
          var element = _path["default"].key(path, key);

          var parsed = parser.parse(x[key], element);
          return Parser.context({
            element: element,
            expected: expected,
            input: x
          }, parsed);
        });
      }, Parser.ok(new Map()));
    }
  };
} // Merge two record parsers to parse one object with the union of their keys


function merge(lhs, rhs) {
  var expected = "merge(".concat(lhs.expected, ", ").concat(rhs.expected, ")");
  return {
    expected: expected,
    parse: function parse(x, path) {
      return _either["default"].liftA2(function (lhs, rhs) {
        return _objectSpread(_objectSpread({}, lhs), rhs);
      }, function () {
        return Parser.context({
          expected: expected,
          input: x
        }, lhs.parse(x, path));
      }, function () {
        return Parser.context({
          expected: expected,
          input: x
        }, rhs.parse(x, path));
      });
    }
  };
} // Apply a function to the result of a parser if it succeeds
//
// Uses the function's name as part of the expected value, so only use
// this for functions that are known to have a non-empty name property.
// Falls back to toString() which is sketchy as hell.
//


function mapStatic(parser, f) {
  var expected = "mapStatic(".concat(parser.expected, ", ").concat(f.name || f.toString(), ")");
  return mapInternal(parser, expected, f);
} // Apply a function to the result of a parser if it succeeds
//
// Second argument should adequately identify the function's behavior
// so it can be used in the expected value, which can then be used
// to compare Parsers for rough equality.
//


function map(parser, name, f) {
  var expected = "map(".concat(parser.expected, ", ").concat(name, ", _)");
  return mapInternal(parser, expected, f);
}

function mapInternal(parser, expected, f) {
  return {
    expected: expected,
    parse: function parse(x, path) {
      var parsed = parser.parse(x, path);
      return _either["default"].map(f, Parser.context({
        expected: expected
      }, parsed));
    }
  };
} // Unobfuscate the response and make sure it follow the expected format


function obfuscated(parser) {
  var expected = "obfuscated(".concat(parser.expected, ")");
  return {
    expected: expected,
    parse: function parse(x, path) {
      return _either["default"].bind(string().parse(x, path), function (s) {
        var unObfuscated;

        try {
          unObfuscated = JSON.parse(b64DecodeUnicode(s));
        } catch (e) {
          return Parser.fail({
            expected: expected,
            got: s
          });
        }

        return parser.parse(unObfuscated, path);
      });
    }
  };
}

var Parser = {
  // Smart constructor for a successful parse
  ok: function ok(result) {
    return _either["default"].pure(result);
  },
  // Smart constructor for a failure at the leaf level
  fail: function fail(obj) {
    return _either["default"].fail(_objectSpread({
      tag: 'fail'
    }, obj));
  },
  // Mark failure fatal
  commit: function commit(parsed) {
    return _either["default"].bimap(function (error) {
      if (error.tag === 'context') {
        return _objectSpread(_objectSpread({}, error), {}, {
          level: 'fatal'
        });
      }

      return error;
    }, function (x) {
      return x;
    }, parsed);
  },
  // Check if a failure is failure
  isFatal: function isFatal(parsed) {
    return parsed.tag === 'left' && parsed.left.tag === 'context' && parsed.left.level === 'fatal';
  },
  // Add context to an existing parse result if it already
  // represents a failure
  //
  // The following pieces of context can be supplied
  //    input - the value being parsed
  //    element - path to the element in the input being scrutinized
  //    expected - representation of an input that would successfully parse
  context: function context(args, parsed) {
    var input = args.input,
        level = args.level,
        element = args.element,
        expected = args.expected;
    return _either["default"].bimap(function (next) {
      return {
        tag: 'context',
        level: propagate(level, next),
        element: element || _path["default"].skip(),
        expected: expected,
        input: input,
        next: next
      };
    }, function (x) {
      return x;
    }, parsed);
  },
  // Re-export under Parser
  typeOf: typeOf,
  literal: literal,
  string: string,
  stringInt: stringInt,
  number: number,
  rounded: rounded,
  fixed: fixed,
  "boolean": _boolean,
  nullable: nullable,
  nullableDefault: nullableDefault,
  nullableDefined: nullableDefined,
  array: array,
  nonEmptyArray: nonEmptyArray,
  date: date,
  stringEnum: stringEnum,
  firstOf: firstOf,
  tag: tag,
  field: field,
  fields: fields,
  record: record,
  stringMap: stringMap,
  merge: merge,
  map: map,
  mapStatic: mapStatic,
  // Exported for testing
  runInternal: function runInternal(value, parser, onSuccess, onError) {
    return _either["default"].match(parser.parse(value, _path["default"].root()), {
      left: function left(err) {
        return onError((0, _formatting.formatError)(err));
      },
      right: function right(result) {
        return onSuccess(result);
      }
    });
  },
  // Run a parser on an input. Throws an exception if the parser fails
  run: function run(value, parser) {
    return Parser.runInternal(value, parser, function (result) {
      return result;
    }, function (error) {
      console.log(error);
      throw new Error(error);
    });
  },
  // Make a run function that partially applies `parser`
  mkRun: function mkRun(parser) {
    return function (value) {
      return Parser.run(value, parser);
    };
  }
}; // Taken from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_4_%E2%80%93_escaping_the_string_before_encoding_it

exports.Parser = Parser;

function b64DecodeUnicode(str) {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(atob(str).split('').map(function (c) {
    return "%".concat("00".concat(c.charCodeAt(0).toString(16)).slice(-2));
  }).join(''));
}