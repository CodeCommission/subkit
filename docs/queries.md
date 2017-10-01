# Queries

## Create a GraphQL-Schema via IDL

Edit the `graphql.idl` to add types, queries, mutations and subscriptions.

```graphql
# A item type
type Item {
  id: ID!
  email: String
}

type Query {
  # Items
  items(id: ID): [Item]
}
```

## Build-In Types

### Root types

* Query
* Mutation
* Subscription

### Data types

* String
* Boolean
* Int
* Float
* ID
* NonNull
* ...

### Custom types

* Enum
* Interface
* Union
* JSON
* ...

## Resolver functions

Edit the `graphql.js` to implement type, query, mutation und subscription resolvers.

```javascript
export const resolvers = {
  // ...
  Query: {
    // parent - parent node data
    // args - argument data of current query node
    // context - contextual data passed into every node of current query
    // info - current AST data of current query node
    items: (parent, args, context, info) => [{id: 1, email: 'First'}],
  },
  // ...
}
```

## Resolver Context

The resolve function context is provided to every resolver and holds important contextual information like the currently logged in user,access to loaders for data access or the Publish/Subscribe functions.

```javascript
context = {
  loaders: {
    // passed from loaders
  },
  user: {
    // current JWT auth user informations
  },
  pubsub: {
    // pub/sub functions
  }
}
```

Passing loaders to resolver functions.

```javascript
export const resolvers = {
  // ...
  Query: {
    // load all
    items: (parent, args, context, info) => context.loaders.items.all(),
    // load by ID
    item: (parent, args, context, info) => context.loaders.items.load(args.id),
  },
  // ...
}

export const loaders = {
  // ...
  items: {
    all: () => [
      {id: 1, email: 'First'},
      {id: 2, email: 'Second'},
    ],
    load: id => ({id: 1, email: 'First'}),
  },
  // ...
}
```

## Usage of Query Variables

```graphql

```