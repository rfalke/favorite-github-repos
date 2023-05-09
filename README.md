# Usage

- Start with
```
DEBUG=favorite-repos:* npm start
```

You can pass a GitHub access token to increase the rate limits via environment:
```
DEBUG=favorite-repos:* GITHUB_TOKEN=github_pat_... npm start
```

- Test with
```
curl localhost:3000
```

# Refresh the cached repo file

- It is really needed to access this endpoint since a cache file is checked in. 
- This will likely require a GitHub access token.

```
curl -X POST localhost:3000/repos/refresh
```

# Get all repositories

```
curl -s localhost:3000/repos -s | jq .
```

# Favorite handling

```
# No favorites
curl 'localhost:3000/repos?onlyFavs' -s | jq .

# Mark one repo as a favorite
curl -X POST localhost:3000/repos/fav -H 'Content-Type: application/json' -d '{"repoId":635990360}'

# One favorite found
curl 'localhost:3000/repos?onlyFavs' -s | jq .
```

# Get all repositories (filter by language)

Note that the matching is case-sensitive. So "Python" will work but "python" will not.

```
curl 'localhost:3000/repos?lang=Python' -s | jq .
```

# Format

```
npm run format
```
