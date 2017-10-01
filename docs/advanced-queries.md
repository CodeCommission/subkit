# Advanced Queries

* [Relational data queries](#relational-data-queries)

## Relational data queries

### Schema

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

### Resolvers

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