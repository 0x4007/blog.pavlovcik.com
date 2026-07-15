import type { GetServerSideProps } from 'next'
import { type PageMap } from 'notion-types'

import type { Site } from '@/lib/types'
import { host, site } from '@/lib/config'
import { getContentPageMap } from '@/lib/get-content-page-map'
import { mapPageUrl } from '@/lib/map-page-url'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()
    return {
      props: {}
    }
  }

  const contentPageMap = await getContentPageMap()

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap(site, contentPageMap))
  res.end()

  return {
    props: {}
  }
}

const createSitemap = (site: Site, contentPageMap: PageMap) => {
  const pageUrls = new Set<string>([host])

  for (const [pageId, recordMap] of Object.entries(contentPageMap)) {
    try {
      const pagePath = mapPageUrl(
        site,
        recordMap,
        new URLSearchParams()
      )(pageId)

      if (pagePath !== '/404') {
        pageUrls.add(pagePath === '/' ? host : `${host}${pagePath}`)
      }
    } catch (err) {
      console.warn(`Skipping invalid sitemap page "${pageId}"`, err)
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${Array.from(pageUrls)
      .map((pageUrl) =>
        `
          <url>
            <loc>${pageUrl}</loc>
          </url>
        `.trim()
      )
      .join('')}
  </urlset>
`
}

export default function noop() {
  return null
}
