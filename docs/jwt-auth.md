# JSON Web Token (JWT) Authentication

* [Encode a JSON Web Token](#encode-a-json-web-token)
* [Verify and decode a JSON Web Token](#verify-and-decode-a-json-web-token)
* [Request GraphQL-API using JSON Web Token](#request-graphql-api-using-json-web-token)
* [Usage of JWT authentication for authorization](#usage-of-jwt-authentication-for-authorization)


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
  --query 'query loadAll {items {id email}}'
```

## Usage of JWT authentication for authorization

If authentication is successful, the user information (JWT payload) is passed on to the resolver function context. This allows information about the current user to be used in the resolver functions.

```javascript
export const resolvers = {
  // ...
  Query: {
    items: (parent, args, context, info) => {
      // access to current user for authorization or user specific data fetching
      if (!context.user) return null;
      if (context.user.username !== 'go@subkit.io') return null;

      return context.loaders.items;
    },
  },
  // ...
}
```