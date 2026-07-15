import { siteConfig } from './lib/site-config'

export default siteConfig({
  rootNotionPageId: 'aba833db19a743bbbc3dbdbf990934d3',
  rootNotionSpaceId: '465be4cd-747a-45b8-b171-89d19acacd8a',

  name: "Alex's Blog",
  domain: 'blog.pavlovcik.com',
  author: 'Alexander V. Pavlovcik',
  description: "Alex's Blog",

  twitter: '0x4007',
  github: 'pavlovcik',
  telegram: 'Pavlovcik',

  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  isPreviewImageSupportEnabled: false,
  isRedisEnabled: false,
  navigationStyle: 'default'
})
