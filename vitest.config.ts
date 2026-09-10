import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    mockReset: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      // Set just under what the existing suite measures (88.55/82.08/91.60/89.08),
      // so a drop is caught rather than absorbed by headroom
      thresholds: {
        lines: 85,
        branches: 80,
        functions: 90,
        statements: 85
      }
    }
  }
})
