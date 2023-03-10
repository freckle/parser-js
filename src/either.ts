import {exhaustive} from '@freckle/exhaustive'

// Represent one of two possible values. A value of EitherT<L, R> is _either_
// a value of type L tagged with 'left' or a vaue of type R tagged with 'right'.
//
// When used as a result type, it is typical for values tagged with 'right'
// to represent success (since it's "right") and for values tagged with 'left'
// to represent failure.
export type EitherT<L, R> =
  | {
      tag: 'left'
      left: L
    }
  | {
      tag: 'right'
      right: R
    }

const Either = {
  // Construct a value with the 'left' tag
  Left<L, R>(left: L): EitherT<L, R> {
    return {tag: 'left', left}
  },

  // Construct a value with the 'right' tag
  Right<L, R>(right: R): EitherT<L, R> {
    return {tag: 'right', right}
  },

  // Pattern match on a value of type EitherT<L, R>. Must supply a branch for both
  // and left and right
  match<L, R, T>(
    e: EitherT<L, R>,
    branches: {
      left: (left: L) => T
      right: (right: R) => T
    }
  ): T {
    switch (e.tag) {
      case 'left':
        return branches.left(e.left)
      case 'right':
        return branches.right(e.right)
      default:
        return exhaustive(e, 'EitherT')
    }
  },

  // Wrap a pure value in EitherT by tagging it with 'right'
  pure<L, R>(x: R): EitherT<L, R> {
    return Either.Right(x)
  },

  // Wrap a value in EitherT by tagging it with 'left'
  fail<L, R>(x: L): EitherT<L, R> {
    return Either.Left(x)
  },

  // Apply a pure function to the valued tagged with 'right' if present
  map<L, R, S>(f: (x: R) => S, e: EitherT<L, R>): EitherT<L, S> {
    return Either.bimap(x => x, f, e)
  },

  // Apply a pure function to each of the values tagged with 'right' if
  // present. The argument are lazy to allow for short-circuiting.
  liftA2<L, R, S, T>(
    f: (r: R, s: S) => T,
    a: () => EitherT<L, R>,
    b: () => EitherT<L, S>
  ): EitherT<L, T> {
    return Either.bind(a(), r => Either.bind(b(), s => Either.pure(f(r, s))))
  },

  // Apply the pure function f to the value tagged with 'left' if present. Otherwise,
  // apply the pure function g to the value tagged with 'right'.
  bimap<L, M, R, S>(f: (x: L) => M, g: (x: R) => S, e: EitherT<L, R>): EitherT<M, S> {
    return Either.match(e, {
      left: x => Either.Left(f(x)),
      right: x => Either.Right(g(x))
    })
  },

  // Apply a function that may itself fail to the value tagged with 'right' if
  // present
  bind<L, R, S>(e: EitherT<L, R>, k: (x: R) => EitherT<L, S>): EitherT<L, S> {
    return Either.match(e, {
      left: x => Either.Left(x),
      right: x => k(x)
    })
  },

  // Try the second argument if the first one fails
  alt<L, R>(lhs: () => EitherT<L, R>, rhs: () => EitherT<L, R>): EitherT<L, R> {
    return Either.match(lhs(), {
      left: _x => rhs(),
      right: x => Either.pure(x)
    })
  }
}

export default Either
