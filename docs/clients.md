# Clients

* cURL
* HTTP-Fetch
* SubKit request (TBD)
* Apollo (TBD)
* Relay (TBD)

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

## subkit request

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
  --query 'mutation changeItem {changeItem(input: {id: "subkitio", email: "go@subkit.io"}) {id email}}'
```

### Subscription

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'subscription onItemChanged {onItemChanged {id email}}'
```