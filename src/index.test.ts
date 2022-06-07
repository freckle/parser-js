import forEach from 'lodash/forEach'

import {
  Parser,
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
  field,
  fields,
  record,
  obfuscated,
  merge,
  tag,
  onSelf,
  stringMap
} from './index'

import {parseExpect, parseSuccess, parseFailure} from './test-helper'

describe('Parser', () => {
  describe('test', () => {
    describe('date', () => {
      test('should succeed for valid date string', () => {
        parseSuccess('2016-03-12 13:00:00', date())
      })

      test('should fail for an invalid date string', () => {
        parseFailure('', date())
      })

      test('should fail for incorrect type', () => {
        forEach([1, true, null, {}, []] as Array<any>, x => {
          parseFailure(x, date())
        })
      })
    })

    describe('literal', () => {
      test('should succeed for specific string', () => {
        parseSuccess('x', literal('x'))
      })

      test('should succeed for specific number', () => {
        parseSuccess(0, literal(0))
      })

      test('should fail for incorrect type', () => {
        forEach([1, 'y', true, null, {}, []] as Array<any>, x => {
          parseFailure(x, literal('x'))
        })
      })
    })

    describe('string', () => {
      test('should succeed for string', () => {
        parseSuccess('', string())
      })

      test('should fail for incorrect type', () => {
        forEach([1, true, null, {}, []] as Array<any>, x => {
          parseFailure(x, string())
        })
      })
    })

    describe('stringInt', () => {
      test('should succeed for string that can be parsed as an int', () => {
        parseSuccess('10', stringInt())
      })

      test('should fail for incorrect type', () => {
        forEach([true, null, {}, [], '', 'abc'] as Array<any>, x => {
          parseFailure(x, stringInt())
        })
      })
    })

    describe('number', () => {
      test('should succeed for number', () => {
        parseSuccess(1, number())
      })

      test('should succeed for NaN', () => {
        parseSuccess(NaN, number())
      })

      test('should fail for incorrect type', () => {
        forEach(['', true, null, {}, []] as Array<any>, x => {
          parseFailure(x, number())
        })
      })
    })

    describe('rounded', () => {
      test('should succeed for whole number', () => {
        parseExpect(1, 1, rounded())
      })

      test('should succeed for fractional number', () => {
        parseExpect(1, 1.2, rounded())
        parseExpect(2, 1.6, rounded())
      })

      test('should fail for incorrect type', () => {
        forEach(['', true, null, {}, []] as Array<any>, x => {
          parseFailure(x, rounded())
        })
      })
    })

    describe('fixed', () => {
      test('should succeed for whole number', () => {
        parseExpect(1, 1, fixed(1))
        parseExpect(1, 1, fixed(2))
      })

      test('should succeed for fractional number', () => {
        parseExpect(1.0, 1.033, fixed(1))
        parseExpect(1.3, 1.333, fixed(1))
        parseExpect(1.03, 1.033, fixed(2))
        parseExpect(1.33, 1.333, fixed(2))
      })

      test('should fail for incorrect type', () => {
        forEach(['', true, null, {}, []] as Array<any>, x => {
          parseFailure(x, fixed(1))
        })
      })
    })

    describe('boolean', () => {
      test('should succeed for true', () => {
        parseSuccess(true, boolean())
      })

      test('should succeed for false', () => {
        parseSuccess(false, boolean())
      })

      test('should fail for incorrect type', () => {
        forEach(['', null, {}, []] as Array<any>, x => {
          parseFailure(x, boolean())
        })
      })
    })

    describe('nullable', () => {
      test('should succeed for null', () => {
        parseSuccess(null, nullable(number()))
      })

      test('should succeed for undefined', () => {
        parseSuccess(undefined, nullable(number()))
      })

      test('should convert undefined to null', () => {
        parseExpect(null, undefined, nullable(number()))
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, []] as Array<any>, x => {
          parseFailure(x, nullable(number()))
        })
      })
    })

    describe('nullableDefined', () => {
      test('should succeed for null', () => {
        parseSuccess(null, nullableDefined(number()))
      })

      test('should succeed for undefined', () => {
        parseSuccess(undefined, nullableDefined(number()))
      })

      test('should convert undefined to null', () => {
        parseExpect(null, undefined, nullableDefined(number()))
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, []] as Array<any>, x => {
          parseFailure(x, nullableDefined(number()))
        })
      })
    })

    describe('nullableDefault', () => {
      test('should return the default for null', () => {
        parseExpect(0, null, nullableDefault(number(), 0))
      })

      test('should return the default for undefined', () => {
        parseExpect(0, undefined, nullableDefault(number(), 0))
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, []] as Array<any>, x => {
          parseFailure(x, nullableDefault(number(), 0))
        })
      })
    })

    describe('array', () => {
      test('should succeed for empty array', () => {
        parseSuccess([], array(number()))
      })

      test('should succeed for non-empty array', () => {
        parseSuccess([1, 2, 3], array(number()))
      })

      test('should fail for non-uniform array', () => {
        parseFailure([1, true, 3] as any, array(number()))
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure(x, array(number()))
        })
      })

      test('should fail for incorrect element type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure([x], array(number()))
        })
      })
    })

    describe('nonEmptyArray', () => {
      test('should fail for empty array', () => {
        parseFailure([], nonEmptyArray(number()))
      })

      test('should succeed for non-empty array', () => {
        parseSuccess([1, 2, 3], nonEmptyArray(number()))
      })

      test('should fail for non-uniform array', () => {
        parseFailure([1, true, {x: 10}, null] as any, nonEmptyArray(number()))
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure(x, nonEmptyArray(number()))
        })
      })

      test('should fail for incorrect element type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure([x], nonEmptyArray(number()))
        })
      })
    })

    describe('stringEnum', () => {
      type BooleanT = 'yes' | 'no'

      function parseBoolean(text: string): BooleanT | undefined | null {
        return text === 'yes' ? 'yes' : text === 'no' ? 'no' : null
      }

      const parser = stringEnum('BooleanT', parseBoolean)

      test('should fail for empty string', () => {
        parseFailure('', parser)
      })

      test('should fail for non-empty, non-matching strings', () => {
        parseFailure('yarp', parser)
      })

      test('should succeed for matching strings', () => {
        parseSuccess('yes', parser)
        parseSuccess('no', parser)
      })

      test('should fail for incorrect type', () => {
        forEach([true, 1, {}, null] as Array<any>, x => {
          parseFailure(x, parser)
        })
      })
    })

    describe('firstOf', () => {
      test('should allow one parser', () => {
        parseSuccess(0, firstOf(number()))
        parseFailure(0, firstOf(string()))
      })

      test('should succeed when the first parser succeeds', () => {
        parseSuccess('x', firstOf(literal('x'), literal('y')))
        parseSuccess('y', firstOf(literal('x'), literal('y')))
        parseFailure('z', firstOf(literal('x'), literal('y')))
      })

      test('should short circuit when we commit early with tag()', () => {
        const x = record({tag: tag('x'), contents: number()})
        const y = {
          expected: 'unreachable',
          parse: () => {
            throw new Error('firstOf should have failed in x parser')
          }
        }
        parseSuccess({tag: 'x', contents: 3}, firstOf(x, y))
        parseFailure({tag: 'x', contents: 'x'}, firstOf(x, y))
      })
    })

    describe('record', () => {
      test('should succeed for empty object', () => {
        parseSuccess({}, record({}))
      })

      test('should succeed for non-empty object', () => {
        parseSuccess({a: 'b'}, record({a: string()}))
      })

      test('should succeed with nullable or undefined fields tagged as nullable', () => {
        const parser = record({a: nullable(number())})
        parseSuccess({}, parser)
        parseSuccess({a: null}, parser)
        parseSuccess({a: 2}, parser)
        parseFailure({a: ''}, parser)
      })

      test('should fail for incorrect type', () => {
        forEach([1, true, '', {}, null] as Array<any>, x => {
          parseFailure(x, record({a: number()}))
        })
      })

      test('should fail for incorrect value type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure({a: x}, record({a: number()}))
        })
      })
    })

    describe('field', () => {
      test('should rename input field', () => {
        const parser = record({a: field(number(), 'b')})
        parseExpect({a: 0}, {b: 0}, parser)
        parseFailure({a: 0}, parser)
      })
    })

    describe('fields', () => {
      test('should pick the first successful field', () => {
        const parser = record({a: fields(number(), 'b', 'c')})
        parseExpect({a: 0}, {b: 0}, parser)
        parseExpect({a: 0}, {c: 0}, parser)
        parseExpect({a: 0}, {b: boolean, c: 0}, parser)
        parseFailure({a: 0}, parser)
      })
    })

    describe('onSelf', () => {
      test('should apply a parser to the outer object', () => {
        const point2D = record({x: number(), y: number()})
        const point3D = record({x: number(), y: number(), z: number()})
        const parser = record({point2d: onSelf(point2D), point3d: onSelf(point3D)})
        const goodInput = {x: 0, y: 1, z: 2}
        const badInput = {x: 0, y: 1}
        const expected = {point2d: {x: 0, y: 1}, point3d: {x: 0, y: 1, z: 2}}
        parseExpect(expected, goodInput, parser)
        parseFailure(badInput, parser)
      })
    })

    describe('stringMap', () => {
      test('should succeed for empty object', () => {
        parseSuccess({}, stringMap(string()))
      })

      test('should succeed for non-empty object', () => {
        parseSuccess({a: 'b'}, stringMap(string()))
      })

      test('should succeed with nullable or undefined fields tagged as nullable', () => {
        const parser = stringMap(nullable(number()))
        parseSuccess({}, parser)
        parseSuccess({a: null, b: 3}, parser)
        parseSuccess({a: 2, b: null}, parser)
        parseFailure({a: ''}, parser)
      })

      test('should fail with nullable or undefined fields not tagged as nullable', () => {
        const parser = stringMap(number())
        parseSuccess({}, parser)
        parseFailure({a: null, b: 3}, parser)
        parseFailure({a: 2, b: null}, parser)
        parseSuccess({a: 2, b: 3}, parser)
      })

      test('should fail for incorrect type', () => {
        forEach([1, true, '', null] as Array<any>, x => {
          parseFailure(x, stringMap(number()))
        })
      })

      test('should fail for incorrect value type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure({a: x}, stringMap(number()))
        })
      })
    })

    describe('merge', () => {
      test('should succeed for empty object', () => {
        parseSuccess({}, merge(record({}), record({})))
      })

      test('should succeed for non-empty object', () => {
        const empty = record({})
        const hasNum = record({a: number()})
        const hasBool = record({b: boolean()})
        parseSuccess({a: 1}, merge(hasNum, empty))
        parseSuccess({b: true}, merge(empty, hasBool))
        parseSuccess({a: 1, b: true}, merge(hasNum, hasBool))
      })

      test('should succeed with nullable or undefined fields tagged as nullable', () => {
        const parser = merge(record({a: nullable(number())}), record({b: boolean()}))

        parseSuccess({b: true}, parser)
        parseSuccess({a: null, b: true}, parser)
        parseSuccess({a: 2, b: true}, parser)
        parseFailure({a: '', b: true}, parser)
      })

      test('should fail for incorrect type', () => {
        const parser = merge(record({a: nullable(number())}), record({b: boolean()}))

        forEach([1, true, '', {}, null] as Array<any>, x => {
          parseFailure(x, parser)
        })
      })

      test('should fail for incorrect value type', () => {
        const parser = merge(record({a: nullable(number())}), record({b: boolean()}))

        forEach([1, '', {}, null] as Array<any>, x => {
          parseFailure({b: x}, parser)
        })
      })
    })

    describe('map', () => {
      test('should map function over result on success', () => {
        parseExpect(
          4,
          2,
          Parser.map(number(), 'square', x => x * x)
        )
        parseExpect(
          false,
          true,
          Parser.map(boolean(), 'negate', x => !x)
        )
        parseExpect(
          '1',
          1,
          Parser.map(number(), 'toString', x => x.toString())
        )
      })

      test('should fail for incorrect type', () => {
        forEach([true, '', {}, null] as Array<any>, x => {
          parseFailure(
            x,
            Parser.map(number(), 'identity', y => y)
          )
        })
      })

      describe('mapStatic', () => {
        function square(x: number): number {
          return x * x
        }

        function negate(x: boolean): boolean {
          return !x
        }

        function toString(x: number | string): string {
          return x.toString()
        }

        function identity<A>(a: A): A {
          return a
        }

        test('should map function over result on success', () => {
          parseExpect(4, 2, Parser.mapStatic(number(), square))
          parseExpect(false, true, Parser.mapStatic(boolean(), negate))
          parseExpect('1', 1, Parser.mapStatic(number(), toString))
        })

        test('should fail for incorrect type', () => {
          forEach([true, '', {}, null] as Array<any>, x => {
            parseFailure(x, Parser.mapStatic(number(), identity))
          })
        })
      })
    })

    describe('obfuscated', () => {
      test('should fail when the field does not exist', () => {
        parseFailure(null, obfuscated(record({a: number()})))
      })

      test('should fail when the field is not obfuscated', () => {
        parseFailure(1, obfuscated(record({a: number()})))
      })

      test('should succeed on encoded an array of value', () => {
        const obfuscatedNumber = 'WyI1MCJd' // == ["50"]
        parseSuccess(obfuscatedNumber, obfuscated(array(string())))
      })
    })
  })
})
