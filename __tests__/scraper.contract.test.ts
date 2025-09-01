import fs from 'fs'
import path from 'path'
import nock from 'nock'
import { scrapeLabelPage } from '../src/scrapers/scrapeLabelPage'

describe('scrapeLabelPage contract tests (recorded fixtures)', () => {
  const fixturesDir = path.resolve(__dirname, '..', 'tests', 'fixtures', 'scraper')
  const files = fs.readdirSync(fixturesDir).filter(f => f.endsWith('.html'))

  for (const f of files) {
    test(`scrapes ${f}`, async () => {
      const html = fs.readFileSync(path.join(fixturesDir, f), 'utf8')
      const url = `https://example.test/${f}`
      nock('https://example.test').get(`/${f}`).reply(200, html)

      const out = await scrapeLabelPage(url)
      expect(out).toHaveProperty('name')
      expect(out).toHaveProperty('ingredients')
      expect(Array.isArray(out.ingredients)).toBe(true)
      expect(out).toMatchSnapshot()

      nock.cleanAll()
    })
  }
})
