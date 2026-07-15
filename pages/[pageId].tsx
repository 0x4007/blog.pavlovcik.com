import { type GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev } from '@/lib/config'
import { getHttpErrorStatus } from '@/lib/get-http-error-status'
import { getSiteMap } from '@/lib/get-site-map'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { type PageProps, type Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params.pageId as string

  try {
    const props = await resolveNotionPage(rawPageId)

    if (props.error?.statusCode === 404) {
      return { notFound: true, revalidate: 10 }
    }

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)

    // Public Notion pages can leave stale child links behind. Treat definitive
    // client-side Notion failures as missing pages, while allowing rate limits
    // and server errors to fail ISR so previously generated content is kept.
    const status = getHttpErrorStatus(err)
    if (status === 400 || status === 404) {
      return { notFound: true, revalidate: 10 }
    }

    // we don't want to publish the error version of this page, so
    // let next.js know explicitly that incremental SSG failed
    throw err
  }
}

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true
    }
  }

  const siteMap = await getSiteMap()

  return {
    paths: Object.keys(siteMap.canonicalPageMap).map((pageId) => ({
      params: {
        pageId
      }
    })),
    // paths: [],
    fallback: 'blocking'
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
