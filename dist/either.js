"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _exhaustiveJs = require("@freckle/exhaustive-js");

var Either = {
  // Construct a value with the 'left' tag
  Left: function Left(left) {
    return {
      tag: 'left',
      left: left
    };
  },
  // Construct a value with the 'right' tag
  Right: function Right(right) {
    return {
      tag: 'right',
      right: right
    };
  },
  // Pattern match on a value of type EitherT<L, R>. Must supply a branch for both
  // and left and right
  match: function match(e, branches) {
    switch (e.tag) {
      case 'left':
        return branches.left(e.left);

      case 'right':
        return branches.right(e.right);

      default:
        return (0, _exhaustiveJs.exhaustive)(e, 'EitherT');
    }
  },
  // Wrap a pure value in EitherT by tagging it with 'right'
  pure: function pure(x) {
    return Either.Right(x);
  },
  // Wrap a value in EitherT by tagging it with 'left'
  fail: function fail(x) {
    return Either.Left(x);
  },
  // Apply a pure function to the valued tagged with 'right' if present
  map: function map(f, e) {
    return Either.bimap(function (x) {
      return x;
    }, f, e);
  },
  // Apply a pure function to each of the values tagged with 'right' if
  // present. The argument are lazy to allow for short-circuiting.
  liftA2: function liftA2(f, a, b) {
    return Either.bind(a(), function (r) {
      return Either.bind(b(), function (s) {
        return Either.pure(f(r, s));
      });
    });
  },
  // Apply the pure function f to the value tagged with 'left' if present. Otherwise,
  // apply the pure function g to the value tagged with 'right'.
  bimap: function bimap(f, g, e) {
    return Either.match(e, {
      left: function left(x) {
        return Either.Left(f(x));
      },
      right: function right(x) {
        return Either.Right(g(x));
      }
    });
  },
  // Apply a function that may itself fail to the value tagged with 'right' if
  // present
  bind: function bind(e, k) {
    return Either.match(e, {
      left: function left(x) {
        return Either.Left(x);
      },
      right: function right(x) {
        return k(x);
      }
    });
  },
  // Try the second argument if the first one fails
  alt: function alt(lhs, rhs) {
    return Either.match(lhs(), {
      left: function left(_x) {
        return rhs();
      },
      right: function right(x) {
        return Either.pure(x);
      }
    });
  }
};
var _default = Either;
exports["default"] = _default;