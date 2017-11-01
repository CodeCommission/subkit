# Advanced Queries

* [Relational data queries](#relational-data-queries)
  * [Expand the GraphQL-Schema](#expand-the-graphql-schema)
  * [Implement the resolver functions](#implement-the-resolver-function)
  * [Execute a GraphQL query](#execute-a-graphql-query)
  * [Prepare and usage of persistent GraphQL query](#persistent-graphql-query)

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

## Persistent GraphQL query

Benefits of persistent queries:

* Whitelisting GraphQL queries to prevent very complex queries
* Save bandwidth, because only the **operationName** and **variables** will submitted

### How to create and use persistent queries

Create a file in your root directory named as your query operation name with `.gql` extention (e.g. `./loadItems.gql`).

**`./loadItems.gql`**

```graphql
query loadItems($take: Int) {
  items(take: $take) {
    id
    email
  }
}
```

Run a persistent query using the operation name only.

```bash
subkit request -u http://localhost:8080/graphql --operation loadItems --variables '{"take": 10}'
```