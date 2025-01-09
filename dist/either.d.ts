export type EitherT<L, R> = {
    tag: 'left';
    left: L;
} | {
    tag: 'right';
    right: R;
};
declare const Either: {
    Left<L, R>(left: L): EitherT<L, R>;
    Right<L, R>(right: R): EitherT<L, R>;
    match<L, R, T>(e: EitherT<L, R>, branches: {
        left: (left: L) => T;
        right: (right: R) => T;
    }): T;
    pure<L, R>(x: R): EitherT<L, R>;
    fail<L, R>(x: L): EitherT<L, R>;
    map<L, R, S>(f: (x: R) => S, e: EitherT<L, R>): EitherT<L, S>;
    liftA2<L, R, S, T>(f: (r: R, s: S) => T, a: () => EitherT<L, R>, b: () => EitherT<L, S>): EitherT<L, T>;
    bimap<L, M, R, S>(f: (x: L) => M, g: (x: R) => S, e: EitherT<L, R>): EitherT<M, S>;
    bind<L, R, S>(e: EitherT<L, R>, k: (x: R) => EitherT<L, S>): EitherT<L, S>;
    alt<L, R>(lhs: () => EitherT<L, R>, rhs: () => EitherT<L, R>): EitherT<L, R>;
};
export default Either;
