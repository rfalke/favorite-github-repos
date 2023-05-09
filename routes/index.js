const { Octokit } = require('@octokit/core')
const {
  paginateRest
} = require('@octokit/plugin-paginate-rest')
const { writeFileSync } = require('fs')
const express = require('express')
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
})

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
  writeFileSync('cached_github_repos.json', JSON.stringify(items))

  return res.json({ message: 'Wrote ' + items.length + ' repos to cache file' })
})

module.exports = router
