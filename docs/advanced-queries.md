# Advanced Queries

* [Relational data queries](#relational-data-queries)
  * [Expand the GraphQL-Schema](#expand-the-graphql-schema)
  * [Implement the resolver functions](#implement-the-resolver-function)
  * [Execute a GraphQL query](#execute-a-graphql-query)

## Relational data queries

### Expand the GraphQL-Schema

```graphql
# ...
type Item {
  # ...
  email: String
  # Gravatar picture
  picture: Picture
  # ...
}

# Gravatar picture
type Picture {
  link: String
}
# ...
```

### Implement the resolver function

```javascript
const crypto = require('crypto');

export const resolvers = {
  // ...
  Item: {
    picture: (parent, args, context, info) => {
      const pictureHash = crypto.createHash('md5').update(parent.email).digest('hex');
      return ({
        link: `https://www.gravatar.com/avatar/${pictureHash}`,
      })
    },
  },
  // ...
}
```

## Execute a GraphQL query

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'query loadItem {item(id: "mikebild") {id email picture {link}}}'
```