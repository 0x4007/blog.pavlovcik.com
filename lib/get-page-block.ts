import { type Block, type ExtendedRecordMap } from 'notion-types'
import { getBlockValue, parsePageId } from 'notion-utils'

/** Returns the requested page block regardless of Notion ID formatting. */
export function getPageBlock(
  recordMap: ExtendedRecordMap | undefined,
  pageId: string | undefined
): Block | undefined {
  if (!recordMap || !pageId) return undefined

  const pageUuid = parsePageId(pageId, { uuid: true })
  const cleanPageId = parsePageId(pageId, { uuid: false })

  return getBlockValue(
    recordMap.block[pageId] ||
      (pageUuid ? recordMap.block[pageUuid] : undefined) ||
      (cleanPageId ? recordMap.block[cleanPageId] : undefined)
  )
}
