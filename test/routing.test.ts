import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { type ExtendedRecordMap } from 'notion-types'

import {
  getCanonicalPageId,
  isRootPageChild
} from '../lib/get-canonical-page-id.ts'
import { getCanonicalPageUrl, mapPageUrl } from '../lib/map-page-url.ts'

const rootPageId = 'aba833db-19a7-43bb-bc3d-bdbf990934d3'

test('site configuration contains no manual route registry', async () => {
  const [source, configLoaderSource] = await Promise.all([
    readFile(new URL('../site.config.ts', import.meta.url), 'utf8'),
    readFile(new URL('../lib/get-config-value.ts', import.meta.url), 'utf8')
  ])

  assert.doesNotMatch(source, /pageUrlOverrides|includeNotionIdInUrls/)
  assert.doesNotMatch(configLoaderSource, /NEXT_PUBLIC_SITE_CONFIG/)
})

test('direct root children get clean title-derived routes', () => {
  const page = block({
    id: 'cc6c34ba-6e08-43fc-85a3-a0c16a7b0912',
    type: 'page',
    parentId: rootPageId,
    title: 'Upcoming Events'
  })
  const recordMap = createRecordMap(page)

  assert.equal(isRootPageChild(page.id, recordMap, rootPageId), true)
  assert.equal(
    getCanonicalPageId(page.id, recordMap, rootPageId),
    'upcoming-events'
  )
})

test('search results use their own record map when generating routes', () => {
  const page = block({
    id: 'a5aa5161-180f-47cd-b17d-5979484aa89f',
    type: 'page',
    parentId: rootPageId,
    title: 'Past Events'
  })
  const incompleteRecordMap = createRecordMap(
    block({
      ...page,
      parentId: '11111111-1111-4111-8111-111111111111'
    })
  )
  const searchRecordMap = createRecordMap(page)
  const site = {
    name: "Alex's Blog",
    domain: 'blog.pavlovcik.com',
    rootNotionPageId: rootPageId.replaceAll('-', ''),
    rootNotionSpaceId: '465be4cd-747a-45b8-b171-89d19acacd8a'
  }

  assert.equal(
    mapPageUrl(
      site,
      incompleteRecordMap,
      new URLSearchParams()
    )(page.id, searchRecordMap),
    '/past-events'
  )
})

test('pages below layout blocks retain their Notion ID', () => {
  const columnList = block({
    id: '11111111-1111-4111-8111-111111111111',
    type: 'column_list',
    parentId: rootPageId
  })
  const column = block({
    id: '22222222-2222-4222-8222-222222222222',
    type: 'column',
    parentId: columnList.id
  })
  const page = block({
    id: '42700dc9-4fcf-4d5f-a829-cac0aa5acd38',
    type: 'page',
    parentId: column.id,
    title: 'About'
  })
  const recordMap = createRecordMap(columnList, column, page)

  assert.equal(isRootPageChild(page.id, recordMap, rootPageId), false)
  assert.equal(
    getCanonicalPageId(page.id, recordMap, rootPageId),
    'about-42700dc94fcf4d5fa829cac0aa5acd38'
  )
})

test('deeper pages retain their Notion ID', () => {
  const parentPage = block({
    id: 'a5aa5161-180f-47cd-b17d-5979484aa89f',
    type: 'page',
    parentId: rootPageId,
    title: 'Past Events'
  })
  const columnList = block({
    id: '33333333-3333-4333-8333-333333333333',
    type: 'column_list',
    parentId: parentPage.id
  })
  const column = block({
    id: '44444444-4444-4444-8444-444444444444',
    type: 'column',
    parentId: columnList.id
  })
  const page = block({
    id: 'e9b6f35f-261a-473c-823b-c8d8793619e2',
    type: 'page',
    parentId: column.id,
    title: 'Christmas Party 2023'
  })
  const recordMap = createRecordMap(parentPage, columnList, column, page)

  assert.equal(isRootPageChild(page.id, recordMap, rootPageId), false)
  assert.equal(
    getCanonicalPageId(page.id, recordMap, rootPageId),
    'christmas-party-2023-e9b6f35f261a473c823bc8d8793619e2'
  )
})

test('collection pages and incomplete ancestry default to ID-bearing routes', () => {
  const collectionPage = block({
    id: '55555555-5555-4555-8555-555555555555',
    type: 'page',
    parentId: '66666666-6666-4666-8666-666666666666',
    parentTable: 'collection',
    title: 'Release Notes'
  })
  const incompletePage = block({
    id: '77777777-7777-4777-8777-777777777777',
    type: 'page',
    parentId: '88888888-8888-4888-8888-888888888888',
    title: 'Missing Parent'
  })
  const recordMap = createRecordMap(collectionPage, incompletePage)

  assert.equal(
    getCanonicalPageId(collectionPage.id, recordMap, rootPageId),
    'release-notes-55555555555545558555555555555555'
  )
  assert.equal(
    getCanonicalPageId(incompletePage.id, recordMap, rootPageId),
    'missing-parent-77777777777747778777777777777777'
  )
})

test('invalid page identifiers do not generate a route', () => {
  assert.equal(
    getCanonicalPageId('not-a-notion-page', createRecordMap(), rootPageId),
    null
  )
})

test('invalid internal page URLs resolve to the 404 route', () => {
  const site = {
    name: "Alex's Blog",
    domain: 'blog.pavlovcik.com',
    rootNotionPageId: rootPageId,
    rootNotionSpaceId: '465be4cd-747a-45b8-b171-89d19acacd8a'
  }
  const recordMap = createRecordMap()

  assert.equal(
    mapPageUrl(site, recordMap, new URLSearchParams())('invalid'),
    '/404'
  )
  assert.equal(
    getCanonicalPageUrl(site, recordMap)('invalid'),
    'https://blog.pavlovcik.com/404'
  )
})

test('clean slug resolution fetches the complete Notion page', async () => {
  const source = await readFile(
    new URL('../lib/resolve-notion-page.ts', import.meta.url),
    'utf8'
  )

  assert.doesNotMatch(source, /recordMap\s*=\s*siteMap\.pageMap/)
  assert.match(source, /recordMap\s*=\s*await getPage\(pageId\)/)
})

function block({
  id,
  type,
  parentId,
  parentTable = 'block',
  title
}: {
  id: string
  type: string
  parentId: string
  parentTable?: string
  title?: string
}) {
  return {
    id,
    type,
    parent_id: parentId,
    parent_table: parentTable,
    properties: title ? { title: [[title]] } : undefined
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
