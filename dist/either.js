"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exhaustive_js_1 = require("@freckle/exhaustive-js");
const Either = {
    // Construct a value with the 'left' tag
    Left(left) {
        return { tag: 'left', left };
    },
    // Construct a value with the 'right' tag
    Right(right) {
        return { tag: 'right', right };
    },
    // Pattern match on a value of type EitherT<L, R>. Must supply a branch for both
    // and left and right
    match(e, branches) {
        switch (e.tag) {
            case 'left':
                return branches.left(e.left);
            case 'right':
                return branches.right(e.right);
            default:
                return (0, exhaustive_js_1.exhaustive)(e, 'EitherT');
        }
    },
    // Wrap a pure value in EitherT by tagging it with 'right'
    pure(x) {
        return Either.Right(x);
    },
    // Wrap a value in EitherT by tagging it with 'left'
    fail(x) {
        return Either.Left(x);
    },
    // Apply a pure function to the valued tagged with 'right' if present
    map(f, e) {
        return Either.bimap(x => x, f, e);
    },
    // Apply a pure function to each of the values tagged with 'right' if
    // present. The argument are lazy to allow for short-circuiting.
    liftA2(f, a, b) {
        return Either.bind(a(), r => Either.bind(b(), s => Either.pure(f(r, s))));
    },
    // Apply the pure function f to the value tagged with 'left' if present. Otherwise,
    // apply the pure function g to the value tagged with 'right'.
    bimap(f, g, e) {
        return Either.match(e, {
            left: x => Either.Left(f(x)),
            right: x => Either.Right(g(x))
        });
    },
    // Apply a function that may itself fail to the value tagged with 'right' if
    // present
    bind(e, k) {
        return Either.match(e, {
            left: x => Either.Left(x),
            right: x => k(x)
        });
    },
    // Try the second argument if the first one fails
    alt(lhs, rhs) {
        return Either.match(lhs(), {
            left: _x => rhs(),
            right: x => Either.pure(x)
        });
    }
};
exports.default = Either;
