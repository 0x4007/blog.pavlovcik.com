import ExpiryMap from 'expiry-map'
import { type ExtendedRecordMap, type PageMap } from 'notion-types'
import { getBlockValue, uuidToId } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import { getPageBlock } from './get-page-block.ts'

export type ContentPageLoader = (pageId: string) => Promise<ExtendedRecordMap>

export type ContentPageLoadErrorHandler = (
  pageId: string,
  error: unknown
) => void

/**
 * Discovers the blog's standalone Notion hierarchy without treating it as a
 * database: root page -> category pages -> event pages.
 */
export async function discoverContentPageMap(
  rootPageId: string,
  loadPage: ContentPageLoader,
  onLoadError: ContentPageLoadErrorHandler = logPageLoadError
): Promise<PageMap> {
  const rootRecordMap = await loadPage(rootPageId)
  const pageMap: PageMap = {
    [uuidToId(rootPageId)]: rootRecordMap
  }

  const categoryPageIds = getDirectChildPageIds(rootRecordMap, rootPageId)
  const categoryRecordMaps = await loadPages(
    categoryPageIds,
    loadPage,
    onLoadError
  )

  for (const [pageId, recordMap] of categoryRecordMaps) {
    pageMap[uuidToId(pageId)] = recordMap
  }

  const contentPageIds = Array.from(
    new Set(
      categoryRecordMaps.flatMap(([categoryPageId, recordMap]) =>
        getDirectChildPageIds(recordMap, categoryPageId)
      )
    )
  )
  const contentRecordMaps = await loadPages(
    contentPageIds,
    loadPage,
    onLoadError
  )

  for (const [pageId, recordMap] of contentRecordMaps) {
    pageMap[uuidToId(pageId)] = recordMap
  }

  return pageMap
}

/** Returns only direct standalone page children of a specific Notion page. */
export function getDirectChildPageIds(
  recordMap: ExtendedRecordMap,
  parentPageId: string
): string[] {
  const pageIds = new Set<string>()

  for (const record of Object.values(recordMap.block)) {
    const block = getBlockValue(record)

    if (
      block?.type === 'page' &&
      block.parent_table === 'block' &&
      uuidToId(block.parent_id) === uuidToId(parentPageId)
    ) {
      pageIds.add(uuidToId(block.id))
    }
  }

  return Array.from(pageIds)
}

/**
 * Selects event/article pages while excluding the root and its clean-routed
 * category pages.
 */
export function getNestedContentPageIds(
  pageMap: PageMap,
  rootPageId: string
): string[] {
  const rootRecordMap = pageMap[uuidToId(rootPageId)]
  if (!rootRecordMap) return []

  const categoryPageIds = new Set(
    getDirectChildPageIds(rootRecordMap, rootPageId)
  )

  return Object.entries(pageMap).flatMap(([pageId, recordMap]) => {
    if (!recordMap) return []

    const block = getPageBlock(recordMap, pageId)
    const isNestedContentPage =
      block?.type === 'page' &&
      block.parent_table === 'block' &&
      categoryPageIds.has(uuidToId(block.parent_id))

    return isNestedContentPage ? [uuidToId(pageId)] : []
  })
}

export const getContentPageMap = pMemoize(
  async (): Promise<PageMap> => {
    const [config, { notion }] = await Promise.all([
      import('./config'),
      import('./notion-api')
    ])
    const getPage: ContentPageLoader = (pageId) =>
      notion.getPage(pageId, {
        fetchCollections: false,
        fetchRelationPages: false,
        signFileUrls: false,
        ofetchOptions: {
          timeout: 30_000
        }
      })

    return discoverContentPageMap(config.rootNotionPageId, getPage)
  },
  {
    cache: new ExpiryMap(60_000)
  }
)

async function loadPages(
  pageIds: string[],
  loadPage: ContentPageLoader,
  onLoadError: ContentPageLoadErrorHandler
): Promise<Array<[string, ExtendedRecordMap]>> {
  const results = await pMap(
    pageIds,
    async (pageId): Promise<[string, ExtendedRecordMap] | null> => {
      try {
        return [pageId, await loadPage(pageId)]
      } catch (err) {
        onLoadError(pageId, err)
        return null
      }
    },
    { concurrency: 2 }
  )

  return results.filter(
    (result): result is [string, ExtendedRecordMap] => result !== null
  )
}

function logPageLoadError(pageId: string, error: unknown) {
  console.error(`Unable to load Notion content page "${pageId}"`, error)
}
