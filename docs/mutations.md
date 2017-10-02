# Mutations

* [Expand the GraphQL-Schema](#expand-the-graphql-schema)
* [Implement the resolver functions](#implement-the-resolver-function)
* [Execute a GraphQL mutation query](#execute-a-graphql-mutation-query)
* [Usage of GraphQL mutation variables](#usage-of-graphql-mutation-variables)

## Expand the GraphQL-Schema

```graphql
# ...
# Item input type
input ItemInput {
  id: ID!
  email: String
}

type Mutation {
  # Upsert an item
  upsertItem(input: ItemInput!): Item
  # Remove an item
  removeItem(id: ID!): Boolean
}
# ...
```

## Implement the resolver function

```javascript
export const resolvers = {
  // ...
  Mutation: {
    upsertItem: (parent, args, context, info) => context.loaders.items.upsert(args.input),
    removeItem: (parent, args, context, info) => context.loaders.items.remove(args.id),
  },
  // ...
}

const itemsStore = {}
export const loaders = {
  // ...
  items: {
    load: id => itemsStore[id],
    all: () =>  Object.values(itemsStore),
    upsert: input => itemsStore[input.id] = input,
    remove: id => delete itemsStore[id],
  },
  // ...
}
```

## Execute a GraphQL mutation query

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'mutation upsertItem{upsertItem(input:{id:\"subkitio\",email:\"go@subkit.io\"}){id email}}'
```

## Usage of GraphQL mutation variables

```graphql
mutation upsertItem($input: ItemInput!) {
  upsertItem(input: $input) {
    id
    email
  }
}
```

```json
{
  "input": {
    "id": "demo",
    "email": "demo@aol.com"
  }
}
```

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'mutation upsertItem($input: ItemInput!) {upsertItem(input: $input) {id email}}' \
  --variables '{"input": {"id": "demo", "email": "demo@aol.com"}}'
```