# Usage

- Start with
```
DEBUG=favorite-repos:* npm start
```

- Test with
```
curl localhost:3000
```

# Refresh the cached repo file

```
curl -X POST localhost:3000/repos/refresh
```

# Get all repositories

```
curl -s localhost:3000/repos | jq .
```

# Format

```
npm run format
```
