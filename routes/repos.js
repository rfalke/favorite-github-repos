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
  debug('Fetching basic repo information ...')
  await octokit.paginate('GET /search/repositories?q=created:%3E' + createdAfter + '&sort=stars&order=desc', parameters, (response, done) => {
    items.push(...response.data)

    // This is only to show that the pagination works
    if (items.length > 100) {
      done()
    }
    return []
  })

  debug('Got infos about ' + items.length + '. Fetching languages ...')
  for (const repo of items) {
    repo.languages = (await octokit.request(repo.languages_url)).data
  }
  debug('Got the language information')

  writeFileSync(CACHE_FILE_NAME, JSON.stringify(items))
  repositories = items

  return res.json({ message: 'Wrote ' + items.length + ' repos to cache file. Will use new list in queries.' })
})

/* POST mark a repo as a favorite. */
router.post('/fav', async function (req, res, next) {
  const body = req.body
  const repoId = body.repoId
  if (!repoId) {
    return res.status(400).send("Missing attribute 'repoId' in POST body")
  }
  const withId = repositories.filter(obj => obj.id === body.repoId)
  if (withId.length === 0) {
    return res.status(400).send('Failed to find a repo with id ' + body.repoId)
  }
  if (withId.length !== 1) {
    return res.status(400).send('Strange ... multiple repos with id ' + body.repoId)
  }
  withId[0].is_fav = true

  return res.json({ message: 'Marked ' + body.repoId + ' as a favorite.' })
})

/* GET repository listing. */
router.get('/', function (req, res, next) {
  let toReturn = repositories
  if ('onlyFavs' in req.query) {
    toReturn = toReturn.filter(obj => obj.is_fav)
  }
  res.json(toReturn.map(obj => inclusivePick(obj, 'id', 'name', 'description', 'html_url', 'stargazers_count')))
})

module.exports = router
