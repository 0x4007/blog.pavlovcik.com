import assert from 'node:assert/strict'
import test from 'node:test'

import { type ExtendedRecordMap } from 'notion-types'

import {
  discoverContentPageMap,
  getDirectChildPageIds,
  getNestedContentPageIds
} from '../lib/get-content-page-map.ts'

const rootPageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const upcomingPageId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const pastPageId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const upcomingEventPageId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const pastEventPageId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const brokenEventPageId = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const teamId = '99999999-9999-4999-8999-999999999999'

test('direct child discovery ignores nested layout pages and non-page blocks', () => {
  const layoutPageId = '11111111-1111-4111-8111-111111111111'
  const layoutId = '22222222-2222-4222-8222-222222222222'
  const recordMap = createRecordMap(
    block({ id: upcomingPageId, type: 'page', parentId: rootPageId }),
    block({ id: pastPageId, type: 'page', parentId: rootPageId }),
    block({ id: layoutId, type: 'column', parentId: rootPageId }),
    block({ id: layoutPageId, type: 'page', parentId: layoutId })
  )

  assert.deepEqual(getDirectChildPageIds(recordMap, rootPageId), [
    upcomingPageId.replaceAll('-', ''),
    pastPageId.replaceAll('-', '')
  ])
})

test('content discovery limits concurrency and isolates inaccessible pages', async () => {
  const maps = new Map<string, ExtendedRecordMap>([
    [
      clean(rootPageId),
      createRecordMap(
        block({
          id: rootPageId,
          type: 'page',
          parentId: teamId,
          parentTable: 'team'
        }),
        block({ id: upcomingPageId, type: 'page', parentId: rootPageId }),
        block({ id: pastPageId, type: 'page', parentId: rootPageId })
      )
    ],
    [
      clean(upcomingPageId),
      createRecordMap(
        block({ id: upcomingPageId, type: 'page', parentId: rootPageId }),
        block({
          id: upcomingEventPageId,
          type: 'page',
          parentId: upcomingPageId
        })
      )
    ],
    [
      clean(pastPageId),
      createRecordMap(
        block({ id: pastPageId, type: 'page', parentId: rootPageId }),
        block({ id: pastEventPageId, type: 'page', parentId: pastPageId }),
        block({ id: brokenEventPageId, type: 'page', parentId: pastPageId })
      )
    ],
    [
      clean(upcomingEventPageId),
      createRecordMap(
        block({
          id: upcomingEventPageId,
          type: 'page',
          parentId: upcomingPageId
        })
      )
    ],
    [
      clean(pastEventPageId),
      createRecordMap(
        block({ id: pastEventPageId, type: 'page', parentId: pastPageId })
      )
    ]
  ])
  const errors: Array<{ pageId: string; error: unknown }> = []
  let activeLoads = 0
  let maxActiveLoads = 0

  const pageMap = await discoverContentPageMap(
    rootPageId,
    async (pageId) => {
      activeLoads++
      maxActiveLoads = Math.max(maxActiveLoads, activeLoads)
      await new Promise((resolve) => setTimeout(resolve, 5))
      activeLoads--

      const recordMap = maps.get(clean(pageId))
      if (!recordMap) throw new Error('Notion page is inaccessible')
      return recordMap
    },
    (pageId, error) => errors.push({ pageId, error })
  )

  assert.equal(maxActiveLoads, 2)
  assert.deepEqual(Object.keys(pageMap), [
    clean(rootPageId),
    clean(upcomingPageId),
    clean(pastPageId),
    clean(upcomingEventPageId),
    clean(pastEventPageId)
  ])
  assert.deepEqual(
    errors.map(({ pageId }) => pageId),
    [clean(brokenEventPageId)]
  )
})

test('feed selection excludes the root and clean-routed category pages', async () => {
  const pageMap = await discoverContentPageMap(rootPageId, async (pageId) => {
    const maps = {
      [clean(rootPageId)]: createRecordMap(
        block({
          id: rootPageId,
          type: 'page',
          parentId: teamId,
          parentTable: 'team'
        }),
        block({ id: upcomingPageId, type: 'page', parentId: rootPageId }),
        block({ id: pastPageId, type: 'page', parentId: rootPageId })
      ),
      [clean(upcomingPageId)]: createRecordMap(
        block({ id: upcomingPageId, type: 'page', parentId: rootPageId }),
        block({
          id: upcomingEventPageId,
          type: 'page',
          parentId: upcomingPageId
        })
      ),
      [clean(pastPageId)]: createRecordMap(
        block({ id: pastPageId, type: 'page', parentId: rootPageId }),
        block({ id: pastEventPageId, type: 'page', parentId: pastPageId })
      ),
      [clean(upcomingEventPageId)]: createRecordMap(
        block({
          id: upcomingEventPageId,
          type: 'page',
          parentId: upcomingPageId
        })
      ),
      [clean(pastEventPageId)]: createRecordMap(
        block({ id: pastEventPageId, type: 'page', parentId: pastPageId })
      )
    }

    return maps[clean(pageId)]
  })

  assert.deepEqual(getNestedContentPageIds(pageMap, rootPageId), [
    clean(upcomingEventPageId),
    clean(pastEventPageId)
  ])
})

function block({
  id,
  type,
  parentId,
  parentTable = 'block'
}: {
  id: string
  type: string
  parentId: string
  parentTable?: string
}) {
  return {
    id,
    type,
    parent_id: parentId,
    parent_table: parentTable
  }
}

function createRecordMap(...blocks: ReturnType<typeof block>[]) {
  return {
    block: Object.fromEntries(
      blocks.map((value) => [
        value.id,
        {
          role: 'reader',
          value: {
            role: 'reader',
            value
          }
        }
      ])
    )
  } as unknown as ExtendedRecordMap
}

function clean(pageId: string) {
  return pageId.replaceAll('-', '')
}
