"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatError = formatError;
exports.saferStringify = saferStringify;

var _times = _interopRequireDefault(require("lodash/times"));

var _maybe = require("@freckle/maybe");

var _exhaustiveJs = require("@freckle/exhaustive-js");

var _path = _interopRequireDefault(require("./path.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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
      case 'fail':
        {
          var expected = node.expected,
              got = node.got;
          return ['expected', '', indent(2, expected), '', 'but got', ''].concat(_toConsumableArray(formatWithType(got)), _toConsumableArray(lines));
        }

      case 'context':
        {
          var _expected = node.expected,
              element = node.element,
              input = node.input,
              next = node.next;

          var path = _path["default"].join(element);

          var where = path === null || path === undefined ? 'in' : "at key path ".concat(path, " of");
          var example = input === null || input === undefined ? [] : ['', 'specifically', ''].concat(_toConsumableArray(formatWithType(input)));
          var newLines = ['', where, '', indent(2, _expected)].concat(_toConsumableArray(example));
          return walk(next, [].concat(_toConsumableArray(newLines), _toConsumableArray(lines)));
        }

      default:
        return (0, _exhaustiveJs.exhaustive)(node, 'ErrorStackT');
    }
  }

  return walk(root, []).join('\n');
}

function formatWithType(root) {
  return [indent(2, saferStringify(root))].concat(_toConsumableArray(formatType(root)));
}

function formatType(root) {
  var ty = typeofDeep(root); // These types are self-evident, don't print them

  return ty === 'undefined' || ty === 'null' || ty === '{}' ? [] : ['', 'of type', '', indent(2, ty)];
} // Like typeof but recursive one Objects and Arrays


function typeofDeep(root) {
  var maxDepth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 20;

  function walk(node, depth) {
    if (depth >= maxDepth) {
      return '...';
    }

    var basicType = _typeof(node);

    if (basicType !== 'object') {
      return basicType;
    }

    if (node === null) {
      return 'null';
    }

    if (Array.isArray(node)) {
      if (node.length === 0) {
        return 'Array<?>';
      } else {
        var firstTy = walk(node[0], depth + 1);
        var nextTy = null; // Looking for non-uniformity

        for (var i = 1; i < node.length; ++i) {
          var ty = walk(node[i], depth + 1);

          if (ty !== firstTy) {
            nextTy = ty;
            break;
          }
        }

        if (nextTy === null) {
          return "Array<".concat(firstTy, ">");
        } else {
          return "Array<".concat(firstTy, " | ").concat(nextTy, " | ...>");
        }
      }
    }

    var pairs = (0, _maybe.mapMaybes)(Object.keys(node), function (key) {
      return (// eslint-disable-next-line no-prototype-builtins
        node.hasOwnProperty(key) ? "".concat(key, ": ").concat(walk(node[key], depth + 1)) : null
      );
    });
    return "{".concat(pairs.join(', '), "}");
  }

  return walk(root, 0);
} // JSON.stringify ignores undefined and throws on circular objects


function saferStringify(root) {
  if (root === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(root);
  } catch (e) {
    if (e instanceof TypeError) {
      return '{...Circular object or BigInt...}';
    }

    throw e;
  }
} // Indent string n spaces


function indent(n, text) {
  return "".concat((0, _times["default"])(n, function () {
    return ' ';
  }).join('')).concat(text);
}