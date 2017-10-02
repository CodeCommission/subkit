# Clients

* [cURL](#curl)
* [HTTP-Fetch](#http-fetch)
* [SubKit request](#subkit-request)

## cURL

```bash
curl -XPOST 'http://0.0.0.0:8080/graphql' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -H 'Content-Type:application/json' \
  -d '{"query":"{items{id email}}"}'
```

## HTTP-Fetch

```javascript
fetch('http://0.0.0.0:8080/graphql', {
  method: 'post',
  timeout: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_AUTH_TOKEN',
  },
  body: '{"query":"{items{id email}}"}',
})
.then(response => response.json())
```

## SubKit request

`subkit help request`

```bash
Usage: subkit-request [options]


Options:

  -u, --url [url]         URL to GraphQL-API.
  -q, --query [query]     GraphQL query.
  -v, --variables [json]  GraphQL query variables in JSON format.
  -t, --token [token]     JSON web authorization token.
  -h, --help              output usage information
```

### Query

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'query allItems {items {id email}}'
```

### Mutation

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'mutation upsertItem {upsertItem(input: {id: "subkitio", email: "go@subkit.io"}) {id email}}'
```

### Subscription

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'subscription onItemUpserted {onItemUpserted {id email}}'
```