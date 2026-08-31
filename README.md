# parser-js
One that parses

## Dates

`date()` parses ISO-8601 strings into native `Date` objects:

```ts
import {date, Parser} from '@freckle/parser'

Parser.run('2016-03-12T13:00:00Z', date()) // => Date
```

Only ISO-8601 is accepted. Locale-dependent formats are rejected, since
`'03/12/2016'` could mean either March 12 or December 3. Calendar-impossible
dates (`'2016-02-30'`) are rejected rather than rolled over, and date-only
strings resolve to local midnight.

### Migrating from v3

`date()` returned a `Moment` through v3 and returns a `Date` from v4 on. To
keep `Moment` values, convert at the boundary:

```ts
import moment from 'moment-timezone'
import {date, mapStatic} from '@freckle/parser'

const momentDate = () => mapStatic(date(), d => moment(d))
```

## Development

- **Package manager**: pnpm (Node version pinned in `.nvmrc`)
- `pnpm build` — `tsc`, emits to `dist/`
- `pnpm test` — Vitest
- `pnpm coverage` — Vitest with coverage, gated at 70% (lines/branches/functions/statements)
- `pnpm typecheck` — `tsc --noEmit`, includes test files
- `pnpm lint` — ESLint
- `pnpm format` / `pnpm format-check` — Prettier
- `pnpm knip` — unused files/dependencies/exports
- CI runs all of the above on every PR, plus a check that `dist/` is up to date

## Release

See [RELEASE.md](./RELEASE.md).
