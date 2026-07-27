import { getPageBlock } from './get-page-block.ts'
import { type PageProps } from './types.ts'

export async function pageAcl({
  site,
  recordMap,
  pageId
}: PageProps): Promise<PageProps> {
  if (!site) {
    return {
      error: {
        statusCode: 404,
        message: 'Unable to resolve notion site'
      }
    }
  }

  if (!recordMap) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" not found.`
      }
    }
  }

  const rootValue = getPageBlock(recordMap, pageId)

  if (!rootValue) {
    return {
      error: {
        statusCode: 404,
        message: `Unable to resolve page for domain "${site.domain}". Notion page "${pageId}" invalid data.`
      }
    }
  }

  const rootSpaceId = rootValue?.space_id

  if (
    rootSpaceId &&
    site.rootNotionSpaceId &&
    rootSpaceId !== site.rootNotionSpaceId
  ) {
    return {
      error: {
        statusCode: 404,
        message: `Notion page "${pageId}" doesn't belong to the Notion workspace owned by "${site.domain}".`
      }
    }
  }

  return {}
}
