"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _map = _interopRequireDefault(require("lodash/map"));

var _exhaustiveJs = require("@freckle/exhaustive-js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var Path = {
  root: function root() {
    return [];
  },
  // For "invisible" components, e.g. nullable
  skip: function skip() {
    return [];
  },
  // Push an index on the end of a path
  index: function index(path, _index) {
    return [].concat(_toConsumableArray(path), [{
      tag: 'index',
      index: _index
    }]);
  },
  // Push a key on the end of a path
  key: function key(path, _key) {
    return [].concat(_toConsumableArray(path), [{
      tag: 'key',
      key: _key
    }]);
  },
  // Convert a Path into a string representation
  join: function join(path) {
    var strings = (0, _map["default"])(path, function (component) {
      switch (component.tag) {
        case 'index':
          return component.index.toString();

        case 'key':
          return component.key;

        default:
          return (0, _exhaustiveJs.exhaustive)(component, 'PathComponentT');
      }
    });
    return strings.length === 0 ? null : strings.join('.');
  }
};
var _default = Path;
exports["default"] = _default;