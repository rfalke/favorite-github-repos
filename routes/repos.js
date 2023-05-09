const express = require('express')
const { Octokit } = require('@octokit/core')
const { paginateRest } = require('@octokit/plugin-paginate-rest')
const { writeFileSync, readFileSync, existsSync } = require('fs')
const router = express.Router()
const debug = require('debug')('favorite-repos:app')

const CACHE_FILE_NAME = 'cached_github_repos.json'

function loadRepositoriesFromFile () {
  if (!existsSync(CACHE_FILE_NAME)) {
    debug('No cached repo file found. Will use empty array.')
    return []
  }
  const result = JSON.parse(readFileSync(CACHE_FILE_NAME))
  debug('Read information about ' + result.length + ' repos from cache file.')
  return result
}

let repositories = loadRepositoriesFromFile()

// From https://stackoverflow.com/questions/17781472/how-to-get-a-subset-of-a-javascript-objects-properties
const inclusivePick = (obj, ...keys) => Object.fromEntries(
  keys.map(key => [key, obj[key]])
)

/* POST refresh repository cache file. */
router.post('/refresh', async function (req, res, next) {
  const aWeekAgo = new Date()
  aWeekAgo.setDate(aWeekAgo.getDate() - 7)
  const createdAfter = aWeekAgo.toISOString().slice(0, 10)

  const MyOctokit = Octokit.plugin(paginateRest)
  const octokit = new MyOctokit()
  const parameters = { per_page: 100 }
  const items = []
  await octokit.paginate('GET /search/repositories?q=created:%3E' + createdAfter + '&sort=stars&order=desc', parameters, (response, done) => {
    items.push(...response.data)

    // This is only to show that the pagination works
    if (items.length > 100) {
      done()
    }
    return []
  })
  writeFileSync(CACHE_FILE_NAME, JSON.stringify(items))
  repositories = items

  return res.json({ message: 'Wrote ' + items.length + ' repos to cache file. Will use new list in queries.' })
})

/* GET repository listing. */
router.get('/', function (req, res, next) {
  res.json(repositories.map(obj => inclusivePick(obj, 'id', 'name', 'description', 'html_url', 'stargazers_count')))
})

module.exports = router
