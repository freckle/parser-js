import identity from 'lodash/identity'

import {type ParserT, Parser} from '.'

// Set true to see parse results
const verbose = false

function expectSuccess(expected: boolean): (result: any) => boolean {
  return result => {
    if (verbose || !expected) {
      const message = expected ? 'Expected success' : 'Unexpected success'
      console.log(`${message}: ${JSON.stringify(result)}`)
    }
    return expected
  }
}

function expectFailure(expected: boolean): (error: string) => boolean {
  return error => {
    if (verbose || !expected) {
      const message = expected ? 'Expected failure' : 'Unexpected failure'
      console.log(`${message}:\n${error}`)
    }
    return expected
  }
}

// Expect parse to succeed and return specified value
export function parseExpect<R>(expected: R, value: any, parser: ParserT<R>) {
  function die(error: string) {
    if (verbose) {
      console.log(error)
    }
    // Extra newline defeats jest's dumb error formatting
    throw new Error(`\n${error}`)
  }

  expect(Parser.runInternal(value, parser, identity, die)).toEqual(expected)
}

// Expect parse to succeed
export function parseSuccess<R>(value: any, parser: ParserT<R>) {
  expect(Parser.runInternal(value, parser, expectSuccess(true), expectFailure(false))).toEqual(true)
}

// Expect parse to fail
export function parseFailure<R>(value: any, parser: ParserT<R>) {
  expect(Parser.runInternal(value, parser, expectSuccess(false), expectFailure(true))).toEqual(true)
}
