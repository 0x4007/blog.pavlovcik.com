import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

void test('framework and image dependencies stay on audited security patches', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8')
  )

  assert.equal(packageJson.dependencies.next, '^15.5.22')
  assert.equal(packageJson.devDependencies['@next/bundle-analyzer'], '^15.5.22')
  assert.equal(
    packageJson.devDependencies['@next/eslint-plugin-next'],
    '15.5.22'
  )
  assert.equal(packageJson.pnpm.overrides.postcss, '8.5.23')
  assert.equal(packageJson.pnpm.overrides.sharp, '0.35.3')
})
