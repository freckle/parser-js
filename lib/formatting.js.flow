/* @flow */

import times from 'lodash/times'

import {mapMaybes} from '@freckle/maybe'
import {exhaustive} from '@freckle/exhaustive-js'

import Path from './path.js'

import {type ErrorStackT} from './index.js'

// Format an ErrorStackT into a human-readable message
//
// For example, the following ErrorStackT:
//
//   > {
//   >   tag: 'context',
//   >   expected: 'Array<number>',
//   >   child: [{tag: 'index', index: 1}],
//   >   context: [1, true, {x: 10}, null],
//   >   next: {
//   >     tag: 'fail',
//   >     expected: 'number',
//   >     got: true
//   >   }
//   > }
//
// Is formatted as follows:
//
//   > expected
//   >
//   >   number
//   >
//   > but got
//   >
//   >   true: boolean
//   >
//   > at key path 1 of
//   >
//   >   Array<number>
//   >
//   > specifically
//   >
//   >   [1,true,{"x":10},null]
//   >
//   > of type
//   >
//   >   Array<number | boolean | ...>
//
// The top of the error message applies to the deepest part of the
// data structure. Further down, we provide more context about where
// the error occurred.
export function formatError(root: ErrorStackT): string {
  function walk(node: ErrorStackT, lines: Array<string>): Array<string> {
    switch (node.tag) {
      case 'fail': {
        const {expected, got} = node
        return [
          'expected',
          '',
          indent(2, expected),
          '',
          'but got',
          '',
          ...formatWithType(got),
          ...lines
        ]
      }
      case 'context': {
        const {expected, element, input, next} = node

        const path = Path.join(element)
        const where = path === null || path === undefined ? 'in' : `at key path ${path} of`

        const example =
          input === null || input === undefined
            ? []
            : ['', 'specifically', '', ...formatWithType(input)]

        const newLines = ['', where, '', indent(2, expected), ...example]
        return walk(next, [...newLines, ...lines])
      }
      default:
        return exhaustive(node, 'ErrorStackT')
    }
  }

  return walk(root, []).join('\n')
}

function formatWithType(root: any): Array<string> {
  return [indent(2, saferStringify(root)), ...formatType(root)]
}

function formatType(root: any): Array<string> {
  const ty = typeofDeep(root)

  // These types are self-evident, don't print them
  return ty === 'undefined' || ty === 'null' || ty === '{}'
    ? []
    : ['', 'of type', '', indent(2, ty)]
}

// Like typeof but recursive one Objects and Arrays
function typeofDeep(root: any, maxDepth: number = 20): string {
  function walk(node: any, depth: number): string {
    if (depth >= maxDepth) {
      return '...'
    }

    const basicType = typeof node
    if (basicType !== 'object') {
      return basicType
    }

    if (node === null) {
      return 'null'
    }

    if (Array.isArray(node)) {
      if (node.length === 0) {
        return 'Array<?>'
      } else {
        const firstTy = walk(node[0], depth + 1)
        let nextTy = null

        // Looking for non-uniformity
        for (let i = 1; i < node.length; ++i) {
          const ty = walk(node[i], depth + 1)
          if (ty !== firstTy) {
            nextTy = ty
            break
          }
        }

        if (nextTy === null) {
          return `Array<${firstTy}>`
        } else {
          return `Array<${firstTy} | ${nextTy} | ...>`
        }
      }
    }

    const pairs = mapMaybes(Object.keys(node), key =>
      // eslint-disable-next-line no-prototype-builtins
      node.hasOwnProperty(key) ? `${key}: ${walk(node[key], depth + 1)}` : null
    )

    return `{${pairs.join(', ')}}`
  }

  return walk(root, 0)
}

// JSON.stringify ignores undefined and throws on circular objects
export function saferStringify(root: any): string {
  if (root === undefined) {
    return 'undefined'
  }
  try {
    return JSON.stringify(root)
  } catch (e) {
    if (e instanceof TypeError) {
      return '{...Circular object or BigInt...}'
    }
    throw e
  }
}

// Indent string n spaces
function indent(n: number, text: string): string {
  return `${times(n, () => ' ').join('')}${text}`
}
