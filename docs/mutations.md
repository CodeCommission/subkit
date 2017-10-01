# Mutations

## Schema

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

## Resolver

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

## GraphQL Query

```bash
curl -XPOST 'http://0.0.0.0:8080/graphql' \
  -H 'Content-Type:application/json' \
  -H 'Authorization: Bearer YOUR_AUTH_TOKEN' \
  -d '{"query":"mutation upsertItem{upsertItem(input:{id:\"subkitio\",email:\"go@subkit.io\"}){id email}}"}'
```

## Usage of Query Variables

```graphql

```