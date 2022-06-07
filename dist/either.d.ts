export declare type EitherT<L, R> = {
    tag: 'left';
    left: L;
} | {
    tag: 'right';
    right: R;
};
declare const Either: {
    Left<L, R>(left: L): EitherT<L, R>;
    Right<L_1, R_1>(right: R_1): EitherT<L_1, R_1>;
    match<L_2, R_2, T>(e: EitherT<L_2, R_2>, branches: {
        left: (left: L_2) => T;
        right: (right: R_2) => T;
    }): T;
    pure<L_3, R_3>(x: R_3): EitherT<L_3, R_3>;
    fail<L_4, R_4>(x: L_4): EitherT<L_4, R_4>;
    map<L_5, R_5, S>(f: (x: R_5) => S, e: EitherT<L_5, R_5>): EitherT<L_5, S>;
    liftA2<L_6, R_6, S_1, T_1>(f: (r: R_6, s: S_1) => T_1, a: () => EitherT<L_6, R_6>, b: () => EitherT<L_6, S_1>): EitherT<L_6, T_1>;
    bimap<L_7, M, R_7, S_2>(f: (x: L_7) => M, g: (x: R_7) => S_2, e: EitherT<L_7, R_7>): EitherT<M, S_2>;
    bind<L_8, R_8, S_3>(e: EitherT<L_8, R_8>, k: (x: R_8) => EitherT<L_8, S_3>): EitherT<L_8, S_3>;
    alt<L_9, R_9>(lhs: () => EitherT<L_9, R_9>, rhs: () => EitherT<L_9, R_9>): EitherT<L_9, R_9>;
};
export default Either;
