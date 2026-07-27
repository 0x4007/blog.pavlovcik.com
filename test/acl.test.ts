import assert from 'node:assert/strict'
import test from 'node:test'

import { type ExtendedRecordMap } from 'notion-types'

import { pageAcl } from '../lib/acl.ts'
import { type Site } from '../lib/types.ts'

const pageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const configuredSpaceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const site: Site = {
  name: "Alex's Blog",
  domain: 'blog.pavlovcik.com',
  rootNotionPageId: pageId,
  rootNotionSpaceId: configuredSpaceId
}

test('ACL accepts pages from the configured Notion workspace', async () => {
  assert.deepEqual(
    await pageAcl({
      site,
      pageId,
      recordMap: createRecordMap(configuredSpaceId)
    }),
    {}
  )
})

test('ACL hides public pages from other Notion workspaces', async () => {
  const result = await pageAcl({
    site,
    pageId,
    recordMap: createRecordMap('cccccccc-cccc-4ccc-8ccc-cccccccccccc')
  })

  assert.equal(result.error?.statusCode, 404)
})

function createRecordMap(spaceId: string) {
  return {
    block: {
      [pageId]: {
        role: 'reader',
        value: {
          role: 'reader',
          value: { id: pageId, type: 'page', space_id: spaceId }
        }
      }
    }
  } as unknown as ExtendedRecordMap
}
