import reduce from 'lodash/reduce'
import _map from 'lodash/map' // Underscored to avoid name clash
import find from 'lodash/find'
import moment, {type Moment} from 'moment-timezone'
import {type NonEmptyArray, mkNonEmptyFromHead, unconsOnNonEmpty} from '@freckle/non-empty-js'

import Path from './path'
import {type PathT} from './path'
import {type EitherT} from './either'
import Either from './either'
import {formatError} from './formatting'

export {saferStringify} from './formatting'
export {parseExpect, parseSuccess, parseFailure} from './test-helper'

// Recoverable errors mean we can try another parser in
// firstOf. Fatal errors short circuit any operation.
type LevelT = 'recoverable' | 'fatal'

// Linked list of error context for a parse failure
export type ErrorStackT =
  | {
      tag: 'fail'
      expected: string
      got: any
    }
  | {
      tag: 'context'
      level: LevelT
      element: PathT
      expected: string
      input?: any
      next: ErrorStackT
    }

function propagate(level: LevelT | undefined | null, next: ErrorStackT): LevelT {
  if (next.tag === 'context' && next.level === 'fatal') {
    return 'fatal'
  }
  return level || 'recoverable'
}

// Represent parse failure or success
export type ParseResultT<R> = EitherT<ErrorStackT, R>

type ParserBaseT<R> = {
  parse: (x: any, path: PathT) => ParseResultT<R>
  expected: string
}

// A ParserT can validate any object and describe the type of input on which it will succeed
export type ParserT<R> = {
  type: 'parser'
} & ParserBaseT<R>

// A RenamerT is a ParserT that can select different fields in a record
//
// We use a different type for this so you can only use field() or
// fields() as a value in record({key: value}). It doesn't make sense
// (and in fact does not work) anywhere else
export type RenamerT<R> = {
  type: 'renamer'
  fields: NonEmptyArray<string>
} & ParserBaseT<R>

// A TagParserT is a ParserT that commits a record parse by observing the
// presence of a special "tag" field
export type TagParserT<R> = {
  type: 'tag'
} & ParserBaseT<R>

// A SelfParserT is a ParserT that doesn't follow any key down into
// the object. Rather, it parses itself, but attaches the result to
// some key in the output.
export type SelfParserT<R> = {
  type: 'self'
} & ParserBaseT<R>

// ParserT used as the value in a record parser
export type RecordParserT<R> = ParserT<R> | RenamerT<R> | TagParserT<R> | SelfParserT<R>

interface HasToString {
  toString(): string
}

function stringify<A extends HasToString>(a: A): string {
  return typeof a === 'string' ? JSON.stringify(a) : a.toString()
}

export function tag<R extends string | number>(value: R): TagParserT<R> {
  const expected = `tag(${stringify(value)})`
  return {
    type: 'tag',
    expected,
    parse: x => {
      return x === value ? Parser.ok(x) : Parser.fail({expected, got: x})
    }
  }
}

export function onSelf<R>(parser: ParserT<R>): SelfParserT<R> {
  const {parse} = parser
  const expected = `onSelf(${parser.expected})`
  return {
    type: 'self',
    expected,
    parse
  }
}

// Parser that uses equality to decode a literal value
//
// Prefer using tag when the literal is used in a discriminated union
export function literal<R extends string | number>(value: R): ParserT<R> {
  const expected = `literal(${stringify(value)})`
  return {
    type: 'parser',
    expected,
    parse: x => {
      return x === value ? Parser.ok(x) : Parser.fail({expected, got: x})
    }
  }
}

// Parser that uses `typeof`
export function typeOf<R>(ty: string): ParserT<R> {
  const expected = `typeOf(${stringify(ty)})`
  return {
    type: 'parser',
    expected,
    parse: x => {
      return typeof x === ty ? Parser.ok(x) : Parser.fail({expected, got: x})
    }
  }
}

// Lift a pure value into a ParserT
export function pure<A extends HasToString>(a: A): ParserT<A> {
  const expected = `pure(${stringify(a)})`
  return {
    type: 'parser',
    expected,
    parse: _ => Parser.ok(a)
  }
}

// Parser for any
export function any(): ParserT<any> {
  return {
    type: 'parser',
    expected: 'any()',
    parse: Parser.ok
  }
}

// Parser for strings
export function string(): ParserT<string> {
  return typeOf('string')
}

// Parser for int as a string
export function stringInt(): ParserT<number> {
  const expected = 'stringInt()'
  return {
    type: 'parser',
    expected,
    parse: x => {
      const mInt = parseInt(x, 10)
      return isNaN(mInt) ? Parser.fail({expected, got: x}) : Parser.ok(mInt)
    }
  }
}

// Parser for numbers
export function number(): ParserT<number> {
  return typeOf('number')
}

// Parser for rounded numbers
export function rounded(): ParserT<number> {
  return Parser.map(number(), 'round', x => Math.round(x))
}

// Parser for fixed numbers
export function fixed(digits: number): ParserT<number> {
  return Parser.map(number(), 'fixed', x => parseFloat(x.toFixed(digits)))
}

// Parser for booleans
export function boolean(): ParserT<boolean> {
  return typeOf('boolean')
}

// Build parser that returns a default when encountering null or undefined
function withDefault<R, S>(parser: ParserT<R>, def: S, expected: string): ParserT<R | S> {
  return {
    type: 'parser',
    expected,
    parse: (x: any, path: PathT): ParseResultT<R | S> => {
      if (x === null || x === undefined) {
        return Parser.ok(def)
      }
      return Parser.context<R>({expected}, parser.parse(x, path))
    }
  }
}

// Parser for nullable values with a default
export function nullableDefault<R extends HasToString>(parser: ParserT<R>, def: R): ParserT<R> {
  const expected = `nullableDefault(${parser.expected}, ${stringify(def)})`
  return withDefault(parser, def, expected)
}

// Parser for nullable values
export function nullable<R>(parser: ParserT<R>): ParserT<R | undefined | null> {
  const expected = `nullable(${parser.expected})`
  return withDefault(parser, null, expected)
}

// Parser for nullable values that are never undefined after parsing
export function nullableDefined<R>(parser: ParserT<R>): ParserT<null | R> {
  const expected = `nullableDefined(${parser.expected})`
  return withDefault(parser, null, expected)
}

function collect<R>(
  parser: ParserT<R>,
  xs: Array<any>,
  args: {
    path: PathT
    expected: string
  }
): ParseResultT<Array<R>> {
  const {path, expected} = args

  // Intentionally using mutation below
  return reduce(
    xs,
    (acc, x, i: number) => {
      return Either.liftA2(
        (result, parsed) => {
          result[i] = parsed
          return result
        },
        () => acc,
        () => {
          const element = Path.index(path, i)
          const parsed = parser.parse(x, element)
          return Parser.context({element, expected, input: xs}, parsed)
        }
      )
    },
    Parser.ok(new Array(xs.length))
  )
}

// Parser for arrays
export function array<R>(parser: ParserT<R>): ParserT<Array<R>> {
  const expected = `array(${parser.expected})`
  return {
    type: 'parser',
    expected,
    parse: (xs, path) => {
      if (!Array.isArray(xs)) {
        return Parser.fail({expected, got: xs})
      }

      return collect(parser, xs, {path, expected})
    }
  }
}

// Parser for non-empty arrays
export function nonEmptyArray<R>(parser: ParserT<R>): ParserT<NonEmptyArray<R>> {
  const expected = `nonEmptyArray(${parser.expected})`
  return {
    type: 'parser',
    expected,
    parse: (xs, path) => {
      if (!Array.isArray(xs) || xs.length === 0) {
        return Parser.fail({expected, got: xs})
      }
      return collect(parser, xs, {path, expected})
    }
  }
}

// Parser for dates represented as moments
export function date(): ParserT<Moment> {
  const expected = 'date()'
  return {
    type: 'parser',
    expected,
    parse: x => {
      if (typeof x !== 'string') {
        return Parser.fail({expected, got: x})
      }

      const parsed = moment(x)
      if (!parsed.isValid()) {
        return Parser.fail({expected, got: x})
      }

      return Parser.ok(parsed)
    }
  }
}

// Parser for enums given a parsing function
export function stringEnum<R>(
  name: string,
  parse: (text: string) => R | undefined | null
): ParserT<R> {
  // Ignore parse function in expected since name should be enough to
  // identify Parser
  const expected = `stringEnum(${stringify(name)}, _)`
  return {
    type: 'parser',
    expected,
    parse: x => {
      if (typeof x !== 'string') {
        return Parser.fail({expected: name, got: x})
      }

      const parsed = parse(x)
      if (parsed === null || parsed === undefined) {
        return Parser.fail({expected: name, got: x})
      }

      return Parser.ok(parsed)
    }
  }
}

// Simple parser for string enumerations
//
// For example:
// > type MyType = 'foo' | 'bar' | 'baz'
// > oneOf('MyType', ['foo', 'bar', 'baz'])
//
export function oneOf<T extends string>(name: string, all: Array<T>): ParserT<T> {
  return stringEnum(name, (text: string) => find(all, value => value === text))
}

// Parser that succeeds if any of its arguments succeeds
//
// Fatal errors do short circuit. Currently, these are only produced by using the
// special tag() parser which allows committing early inside record()
export function firstOf<R>(first: ParserT<R>, ...rest: Array<ParserT<R>>): ParserT<R> {
  const expecteds = _map([first, ...rest], parser => parser.expected)
  const expected = `firstOf(${expecteds.join(', ')})`
  return {
    type: 'parser',
    expected,
    parse: (x, path) => {
      return reduce(
        rest,
        (lhs, parser) => {
          if (Parser.isFatal(lhs)) {
            return lhs
          }
          return Either.alt(
            () => lhs,
            () => parser.parse(x, path)
          )
        },
        first.parse(x, path)
      )
    }
  }
}

// Parser for selecting different fields than the output field. Fields are tried in order
//
// e.g. The following selects the 'id' or 'ID' field but writes it to the 'uuid' field in the output
//
//   record({uuid: fields(string(), 'id', 'ID')})
//
export function fields<R>(parser: ParserT<R>, first: string, ...rest: Array<string>): RenamerT<R> {
  const {expected, parse} = parser
  const fields = mkNonEmptyFromHead(first, rest)
  const expectedFields = _map(fields, field => stringify(field)).join(', ')
  const prefix = rest.length === 0 ? 'field' : 'fields'
  return {
    type: 'renamer',
    fields,
    expected: `${prefix}(${expected}, ${expectedFields})`,
    parse
  }
}

// Convenient alias for fields when given a single field
//
// e.g. The following selects the 'id' field but writes it to the 'uuid' field in the output
//
//   record({uuid: field('id', string())})
//
export function field<R>(parser: ParserT<R>, field: string): RenamerT<R> {
  return fields(parser, field)
}

function extractTagParser<
  S extends {[key: string]: unknown},
  T extends {
    [P in keyof S]: RecordParserT<S[P]>
  }
>(
  parsers: T
): null | {
  key: string
  parser: TagParserT<S>
} {
  let result = null
  for (const [key, parser] of Object.entries(parsers)) {
    if (parser.type === 'tag') {
      if (result !== null) {
        throw new Error(
          `Cannot have multiple tag parsers in a single record; first - ${result.key}, second - ${key}`
        )
      }
      result = {key, parser}
    }
  }
  return result
}

// Parser for records where each key has its own parser
export function record<
  T extends {
    [P in keyof S]: RecordParserT<S[P]>
  },
  S extends {[key: string]: unknown} = {}
>(parsers: T): ParserT<S> {
  const keys = Object.keys(parsers).sort()
  const pairs = _map(keys, key => `${key}: ${parsers[key].expected}`)
  const expected = `record({${pairs.join(', ')}})`
  const extracted = extractTagParser(parsers)

  return {
    type: 'parser',
    expected,
    parse: (x: any, path: PathT) => {
      if (typeof x !== 'object' || x === null) {
        return Parser.fail({expected, got: x})
      }

      // If we have a tag, we can fail early. However, if we find the
      // tag, any further failures are fatal. Specifically, firstOf()
      // will quit trying any remaining parsers
      let shouldCommit = false
      if (extracted !== null) {
        const {key, parser} = extracted

        const value = x[key]
        if (value === undefined) {
          return Parser.fail({expected: `object with tag at key "${key}"`, got: x})
        }

        const result = parser.parse(value, path)
        if (result.tag === 'right') {
          shouldCommit = true
        } else {
          return Parser.context({element: Path.key(path, key), expected, input: x}, result)
        }
      }

      const parseOne = (parser: RecordParserT<unknown>, key: string, field: string) => {
        if (parser.type === 'self') {
          const parsed = parser.parse(x, path)
          return Parser.context({element: path, expected, input: x}, parsed)
        } else {
          const element = Path.key(path, key)
          const parsed = parser.parse(x[field], Path.key(path, field))
          return Parser.context({element, expected, input: x}, parsed)
        }
      }

      // Intentionally using mutation below
      const result = reduce(
        keys,
        (acc, key) => {
          return Either.liftA2(
            (result, parsed) => ({
              ...result,
              [key]: parsed
            }),
            () => acc,
            () => {
              const parser = parsers[key]
              const [first, rest] =
                parser.type === 'renamer' ? unconsOnNonEmpty(parser.fields) : [key, []]

              return reduce(
                rest,
                (parsed, field) =>
                  Either.alt(
                    () => parsed,
                    () => parseOne(parser, key, field)
                  ),
                parseOne(parser, first, first)
              )
            }
          )
        },
        Parser.ok({} as S)
      )

      // Commit if we found a specific tag
      return shouldCommit ? Parser.commit(result) : result
    }
  }
}

// Parser for records with arbitrary string keys, but homogenous values
export function stringMap<V>(parser: ParserT<V>): ParserT<Map<string, V>> {
  const expected = `stringMap(${parser.expected})`
  return {
    type: 'parser',
    expected,
    parse: (x, path) => {
      if (typeof x !== 'object' || x === null) {
        return Parser.fail({expected, got: x})
      }

      // Intentionally using mutation below
      return reduce(
        Object.keys(x),
        (acc, key) => {
          return Either.liftA2(
            (result, value) => {
              result.set(key, value)
              return result
            },
            () => acc,
            () => {
              const element = Path.key(path, key)
              const parsed = parser.parse(x[key], element)
              return Parser.context({element, expected, input: x}, parsed)
            }
          )
        },
        Parser.ok(new Map())
      )
    }
  }
}

// Merge two record parsers to parse one object with the union of their keys
export function merge<L extends object, R extends object>(
  lhs: ParserT<L>,
  rhs: ParserT<R>
): ParserT<{} & L & R> {
  const expected = `merge(${lhs.expected}, ${rhs.expected})`
  return {
    type: 'parser',
    expected,
    parse: (x, path) => {
      return Either.liftA2(
        (lhs, rhs) => ({...lhs, ...rhs}),
        () => Parser.context({expected, input: x}, lhs.parse(x, path)),
        () => Parser.context({expected, input: x}, rhs.parse(x, path))
      )
    }
  }
}

// Apply a function to the result of a parser if it succeeds
//
// Uses the function's name as part of the expected value, so only use
// this for functions that are known to have a non-empty name property.
// Falls back to toString() which is sketchy as hell.
//
export function mapStatic<A, B>(parser: ParserT<A>, f: (a: A) => B): ParserT<B> {
  const expected = `mapStatic(${parser.expected}, ${f.name || f.toString()})`
  return mapInternal(parser, expected, f)
}

// Apply a function to the result of a parser if it succeeds
//
// Second argument should adequately identify the function's behavior
// so it can be used in the expected value, which can then be used
// to compare Parsers for rough equality.
//
export function map<A, B>(parser: ParserT<A>, name: string, f: (a: A) => B): ParserT<B> {
  const expected = `map(${parser.expected}, ${name}, _)`
  return mapInternal(parser, expected, f)
}

function mapInternal<A, B>(parser: ParserT<A>, expected: string, f: (a: A) => B): ParserT<B> {
  return {
    type: 'parser',
    expected,
    parse: (x, path) => {
      const parsed = parser.parse(x, path)
      return Either.map(f, Parser.context({expected}, parsed))
    }
  }
}

// Unobfuscate the response and make sure it follow the expected format
export function obfuscated<R>(parser: ParserT<R>): ParserT<R> {
  const expected = `obfuscated(${parser.expected})`
  return {
    type: 'parser',
    expected,
    parse: (x, path) =>
      Either.bind(string().parse(x, path), s => {
        let unObfuscated
        try {
          unObfuscated = JSON.parse(b64DecodeUnicode(s))
        } catch (e) {
          return Parser.fail({expected, got: s})
        }
        return parser.parse(unObfuscated, path)
      })
  }
}

export const Parser = {
  // Smart constructor for a successful parse
  ok<R>(result: R): ParseResultT<R> {
    return Either.pure(result)
  },

  // Smart constructor for a failure at the leaf level
  fail<R>(obj: {expected: string; got: any}): ParseResultT<R> {
    return Either.fail({tag: 'fail', ...obj})
  },

  // Mark failure fatal
  commit<R>(parsed: ParseResultT<R>): ParseResultT<R> {
    return Either.bimap(
      error => {
        if (error.tag === 'context') {
          return {...error, level: 'fatal'}
        }
        return error
      },
      x => x,
      parsed
    )
  },

  // Check if a failure is failure
  isFatal<R>(parsed: ParseResultT<R>): boolean {
    return parsed.tag === 'left' && parsed.left.tag === 'context' && parsed.left.level === 'fatal'
  },

  // Add context to an existing parse result if it already
  // represents a failure
  //
  // The following pieces of context can be supplied
  //    input - the value being parsed
  //    element - path to the element in the input being scrutinized
  //    expected - representation of an input that would successfully parse
  context<R>(
    args: {
      input?: any
      level?: LevelT
      element?: PathT
      expected: string
    },
    parsed: ParseResultT<R>
  ): ParseResultT<R> {
    const {input, level, element, expected} = args
    return Either.bimap(
      next => ({
        tag: 'context',
        level: propagate(level, next),
        element: element || Path.skip(),
        expected,
        input,
        next
      }),
      x => x,
      parsed
    )
  },

  // Re-export under Parser
  typeOf,
  literal,
  string,
  stringInt,
  number,
  rounded,
  fixed,
  boolean,
  nullable,
  nullableDefault,
  nullableDefined,
  array,
  nonEmptyArray,
  date,
  stringEnum,
  firstOf,
  tag,
  field,
  fields,
  record,
  stringMap,
  merge,
  map,
  mapStatic,

  // Exported for testing
  runInternal<R, X>(
    value: any,
    parser: ParserT<R>,
    onSuccess: (result: R) => X,
    onError: (error: string) => X
  ): X {
    return Either.match(parser.parse(value, Path.root()), {
      left: err => onError(formatError(err)),
      right: result => onSuccess(result)
    })
  },

  // Run a parser on an input. Throws an exception if the parser fails
  run<R>(value: any, parser: ParserT<R>): R {
    return Parser.runInternal(
      value,
      parser,
      result => result,
      error => {
        console.log(error)
        throw new Error(error)
      }
    )
  },

  // Make a run function that partially applies `parser`
  mkRun<R>(parser: ParserT<R>): (value: any) => R {
    return (value: any): R => Parser.run(value, parser)
  }
}

// Taken from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#Solution_4_%E2%80%93_escaping_the_string_before_encoding_it
function b64DecodeUnicode(str: string): string {
  // Going backwards: from bytestream, to percent-encoding, to original string.
  return decodeURIComponent(
    atob(str)
      .split('')
      .map(c => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
      .join('')
  )
}
