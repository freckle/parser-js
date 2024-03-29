import map from 'lodash/map'

import {exhaustive} from '@freckle/exhaustive'

// Represent components of a path into an object or array
type PathComponentT =
  | {
      tag: 'index'
      index: number
    }
  | {
      tag: 'key'
      key: string
    }

// Represent a path into an object or array
export type PathT = Array<PathComponentT>

const Path = {
  root(): PathT {
    return []
  },

  // For "invisible" components, e.g. nullable
  skip(): PathT {
    return []
  },

  // Push an index on the end of a path
  index(path: PathT, index: number): PathT {
    return [...path, {tag: 'index', index}]
  },

  // Push a key on the end of a path
  key(path: PathT, key: string): PathT {
    return [...path, {tag: 'key', key}]
  },

  // Convert a Path into a string representation
  join(path: PathT): string | undefined | null {
    const strings = map(path, component => {
      switch (component.tag) {
        case 'index':
          return component.index.toString()
        case 'key':
          return component.key
        default:
          return exhaustive(component, 'PathComponentT')
      }
    })

    return strings.length === 0 ? null : strings.join('.')
  }
}

export default Path
