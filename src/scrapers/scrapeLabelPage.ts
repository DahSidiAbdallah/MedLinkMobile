// require to avoid missing type issues in the test environment
const fetch = require('node-fetch')
const cheerio = require('cheerio')

export type ScrapedLabel = {
  name?: string
  strength?: string
  ingredients: string[]
  warnings: string[]
  contraindications: string[]
}

export async function scrapeLabelPage(url: string): Promise<ScrapedLabel> {
  const resp = await fetch(url)
  const html = await resp.text()
  const $ = cheerio.load(html)

  // Very small, heuristic-based extraction. Tests will rely on fixtures for stability.
  const name = $('h1').first().text().trim() || undefined
  const strength = $('h1').first().next('p').text().trim() || undefined

  const ingredients: string[] = []
  $('*').filter((i: number, el: any) => $(el).text().toLowerCase().includes('ingredients')).each((i: number, el: any) => {
    const text = $(el).text().trim()
    if (text) ingredients.push(text)
  })

  const warnings: string[] = []
  $('*').filter((i: number, el: any) => $(el).text().toLowerCase().includes('warning') || $(el).text().toLowerCase().includes('precaution')).each((i: number, el: any) => {
    const text = $(el).text().trim()
    if (text) warnings.push(text)
  })

  const contraindications: string[] = []
  $('*').filter((i: number, el: any) => $(el).text().toLowerCase().includes('contraindicat')).each((i: number, el: any) => {
    const text = $(el).text().trim()
    if (text) contraindications.push(text)
  })

  return { name, strength, ingredients, warnings, contraindications }
}

export default scrapeLabelPage
