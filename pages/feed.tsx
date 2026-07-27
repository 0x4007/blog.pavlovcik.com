import type { GetServerSideProps } from 'next'
import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getBlockValue, idToUuid } from 'notion-utils'
import RSS from 'rss'

import * as config from '@/lib/config'
import {
  getContentPageMap,
  getNestedContentPageIds
} from '@/lib/get-content-page-map'
import { getSocialImageUrl } from '@/lib/get-social-image-url'
import { getCanonicalPageUrl } from '@/lib/map-page-url'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return { props: {} }
  }

  const pageMap = await getContentPageMap()
  const ttlMinutes = 24 * 60 // 24 hours
  const ttlSeconds = ttlMinutes * 60

  const feed = new RSS({
    title: config.name,
    site_url: config.host,
    feed_url: `${config.host}/feed`,
    language: config.language,
    ttl: ttlMinutes
  })

  const items = getNestedContentPageIds(pageMap, config.rootNotionPageId)
    .flatMap((pageId) => {
      const recordMap = pageMap[pageId] as ExtendedRecordMap | undefined
      if (!recordMap) return []

      const block = getBlockValue(
        recordMap.block[pageId] || recordMap.block[idToUuid(pageId)]
      )
      if (!block) return []

      const title = getBlockTitle(block, recordMap) || config.name
      const description = config.description || title
      const url = getCanonicalPageUrl(config.site, recordMap)(pageId)
      const timestamp = block.last_edited_time || block.created_time
      const date = timestamp ? new Date(timestamp) : undefined
      const socialImageUrl = getSocialImageUrl(pageId)

      return [
        {
          title,
          url,
          date,
          description,
          socialImageUrl,
          timestamp: timestamp || 0
        }
      ]
    })
    .sort((a, b) => b.timestamp - a.timestamp)

  for (const item of items) {
    const { title, url, date, description, socialImageUrl } = item

    feed.item({
      title,
      url,
      date,
      description,
      enclosure: socialImageUrl
        ? {
            url: socialImageUrl,
            type: 'image/png'
          }
        : undefined
    })
  }

  const feedText = feed.xml({ indent: true })

  res.setHeader(
    'Cache-Control',
    `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${ttlSeconds}`
  )
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.write(feedText)
  res.end()

  return { props: {} }
}

export default function noop() {
  return null
}
