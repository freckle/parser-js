import { type Moment } from 'moment-timezone';
import { type NonEmptyArray } from '@freckle/non-empty-js';
import { type PathT } from './path';
import { type EitherT } from './either';
export { saferStringify } from './formatting';
export { parseExpect, parseSuccess, parseFailure } from './test-helper';
declare type LevelT = 'recoverable' | 'fatal';
export declare type ErrorStackT = {
    tag: 'fail';
    expected: string;
    got: any;
} | {
    tag: 'context';
    level: LevelT;
    element: PathT;
    expected: string;
    input?: any;
    next: ErrorStackT;
};
export declare type ParseResultT<R> = EitherT<ErrorStackT, R>;
declare type ParserBaseT<R> = {
    parse: (x: any, path: PathT) => ParseResultT<R>;
    expected: string;
};
export declare type ParserT<R> = {
    type: 'parser';
} & ParserBaseT<R>;
export declare type RenamerT<R> = {
    type: 'renamer';
    fields: NonEmptyArray<string>;
} & ParserBaseT<R>;
export declare type TagParserT<R> = {
    type: 'tag';
} & ParserBaseT<R>;
export declare type SelfParserT<R> = {
    type: 'self';
} & ParserBaseT<R>;
export declare type RecordParserT<R> = ParserT<R> | RenamerT<R> | TagParserT<R> | SelfParserT<R>;
interface HasToString {
    toString(): string;
}
export declare function tag<R extends string | number>(value: R): TagParserT<R>;
export declare function onSelf<R>(parser: ParserT<R>): SelfParserT<R>;
export declare function literal<R extends string | number>(value: R): ParserT<R>;
export declare function typeOf<R>(ty: string): ParserT<R>;
export declare function pure<A extends HasToString>(a: A): ParserT<A>;
export declare function any(): ParserT<any>;
export declare function string(): ParserT<string>;
export declare function stringInt(): ParserT<number>;
export declare function number(): ParserT<number>;
export declare function rounded(): ParserT<number>;
export declare function fixed(digits: number): ParserT<number>;
export declare function boolean(): ParserT<boolean>;
export declare function nullableDefault<R extends HasToString>(parser: ParserT<R>, def: R): ParserT<R>;
export declare function nullable<R>(parser: ParserT<R>): ParserT<R | undefined | null>;
export declare function nullableDefined<R>(parser: ParserT<R>): ParserT<null | R>;
export declare function array<R>(parser: ParserT<R>): ParserT<Array<R>>;
export declare function nonEmptyArray<R>(parser: ParserT<R>): ParserT<NonEmptyArray<R>>;
export declare function date(): ParserT<Moment>;
export declare function stringEnum<R>(name: string, parse: (text: string) => R | undefined | null): ParserT<R>;
export declare function oneOf<T extends string>(name: string, all: Array<T>): ParserT<T>;
export declare function firstOf<R>(first: ParserT<R>, ...rest: Array<ParserT<R>>): ParserT<R>;
export declare function fields<R>(parser: ParserT<R>, first: string, ...rest: Array<string>): RenamerT<R>;
export declare function field<R>(parser: ParserT<R>, field: string): RenamerT<R>;
export declare function record<T extends {
    [P in keyof S]: RecordParserT<S[P]>;
}, S extends {
    [key: string]: unknown;
} = {}>(parsers: T): ParserT<S>;
export declare function stringMap<V>(parser: ParserT<V>): ParserT<Map<string, V>>;
export declare function merge<L extends object, R extends object>(lhs: ParserT<L>, rhs: ParserT<R>): ParserT<{} & L & R>;
export declare function mapStatic<A, B>(parser: ParserT<A>, f: (a: A) => B): ParserT<B>;
export declare function map<A, B>(parser: ParserT<A>, name: string, f: (a: A) => B): ParserT<B>;
export declare function obfuscated<R>(parser: ParserT<R>): ParserT<R>;
export declare const Parser: {
    ok<R>(result: R): ParseResultT<R>;
    fail<R_1>(obj: {
        expected: string;
        got: any;
    }): ParseResultT<R_1>;
    commit<R_2>(parsed: ParseResultT<R_2>): ParseResultT<R_2>;
    isFatal<R_3>(parsed: ParseResultT<R_3>): boolean;
    context<R_4>(args: {
        input?: any;
        level?: LevelT;
        element?: PathT;
        expected: string;
    }, parsed: ParseResultT<R_4>): ParseResultT<R_4>;
    typeOf: typeof typeOf;
    literal: typeof literal;
    string: typeof string;
    stringInt: typeof stringInt;
    number: typeof number;
    rounded: typeof rounded;
    fixed: typeof fixed;
    boolean: typeof boolean;
    nullable: typeof nullable;
    nullableDefault: typeof nullableDefault;
    nullableDefined: typeof nullableDefined;
    array: typeof array;
    nonEmptyArray: typeof nonEmptyArray;
    date: typeof date;
    stringEnum: typeof stringEnum;
    firstOf: typeof firstOf;
    tag: typeof tag;
    field: typeof field;
    fields: typeof fields;
    record: typeof record;
    stringMap: typeof stringMap;
    merge: typeof merge;
    map: typeof map;
    mapStatic: typeof mapStatic;
    runInternal<R_5, X>(value: any, parser: ParserT<R_5>, onSuccess: (result: R_5) => X, onError: (error: string) => X): X;
    run<R_6>(value: any, parser: ParserT<R_6>): R_6;
    mkRun<R_7>(parser: ParserT<R_7>): (value: any) => R_7;
};
