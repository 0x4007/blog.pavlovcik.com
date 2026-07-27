import assert from 'node:assert/strict'
import test from 'node:test'

import { getHttpErrorStatus } from '../lib/get-http-error-status.ts'

test('HTTP status extraction supports Notion fetch error shapes', () => {
  assert.equal(getHttpErrorStatus({ statusCode: 400 }), 400)
  assert.equal(getHttpErrorStatus({ response: { status: 404 } }), 404)
  assert.equal(getHttpErrorStatus({ cause: { status: 429 } }), 429)
  assert.equal(getHttpErrorStatus(new Error('network failure')), undefined)
})
