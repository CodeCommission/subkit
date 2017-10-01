# JSON Web Token (JWT) Authentication

## Encode a JSON Web Token

Generates a new JSON Web Token

```bash
subkit jwt \
  --encode '{"username":"go@subkit.io"}' \
  --secret SuperSecret
```

## Verify and decode a JSON Web Token

```bash
subkit jwt \
  --decode eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --secret SuperSecret
```

## Request GraphQL-API using JSON Web Token

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'query load {items {id}}'
```