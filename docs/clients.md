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
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_AUTH_TOKEN',
  },
  body: '{"query":"{items{id email}}"}',
})
.then(response => response.json())
```