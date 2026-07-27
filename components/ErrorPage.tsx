import Image from 'next/image'

import { PageHead } from './PageHead'
import styles from './styles.module.css'

export function ErrorPage({ statusCode }: { statusCode: number }) {
  const title = 'Error'

  return (
    <>
      <PageHead title={title} />

      <div className={styles.container}>
        <main className={styles.main}>
          <h1>Error Loading Page</h1>
          <p className='page-error-message'>This page could not be loaded.</p>
          <p className='page-error-message'>
            You can still read the source page in{' '}
            <a
              href='https://pavlovcik.notion.site/Alex-s-Blog-aba833db19a743bbbc3dbdbf990934d3'
              target='_blank'
              rel='noreferrer'
            >
              Notion
            </a>
            .
          </p>
          {statusCode && <p>Error code: {statusCode}</p>}
          <Image
            src='/error.png'
            alt='Error'
            width={640}
            height={640}
            className={styles.errorImage}
          />
        </main>
      </div>
    </>
  )
}
