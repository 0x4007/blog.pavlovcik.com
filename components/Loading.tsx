import * as React from 'react'

import { LoadingIcon } from './LoadingIcon'
import styles from './styles.module.css'

export const Loading: React.FC = () => (
  <div className={styles.container}>
    <p id='loading-message'>
      Fetching the latest contents from the&nbsp;
      <a
        href='https://pavlovcik.notion.site/Alex-s-Blog-aba833db19a743bbbc3dbdbf990934d3'
        target='_blank'
        rel='noreferrer'
      >
        Alex&apos;s Notion
      </a>
      .
    </p>
    &nbsp;
    <LoadingIcon />
  </div>
)
