import { type ParserT } from '.';
export declare function parseExpect<R>(expected: R, value: any, parser: ParserT<R>): void;
export declare function parseSuccess<R>(value: any, parser: ParserT<R>): void;
export declare function parseFailure<R>(value: any, parser: ParserT<R>): void;
