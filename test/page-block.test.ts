import assert from 'node:assert/strict'
import test from 'node:test'

import { type ExtendedRecordMap } from 'notion-types'

import { getPageBlock } from '../lib/get-page-block.ts'

test('page lookup ignores record insertion order and unwraps Notion records', () => {
  const targetId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const unrelatedId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const target = { id: targetId, type: 'page' }
  const recordMap = {
    block: {
      [unrelatedId]: {
        role: 'reader',
        value: { id: unrelatedId, type: 'text' }
      },
      [targetId]: {
        role: 'reader',
        value: { role: 'reader', value: target }
      }
    }
  } as unknown as ExtendedRecordMap

  assert.deepEqual(
    getPageBlock(recordMap, targetId.replaceAll('-', '')),
    target
  )
})
