# Queries

* [Create GraphQL-Schema via GQL](#create-graphql-schema-via-gql)
* [GraphQL Types](#graphql-types)
* [Implement query resolver functions](#implement-query-resolver-functions)
* [Usage of resolver function context](#usage-of-resolver-function-context)
* [Usage of GraphQL query variables](#usage-of-graphql-query-variables)

## Create GraphQL-Schema via GQL

Edit the `graphql.gql` to add types, queries, mutations and subscriptions.

```graphql
# A item type
type Item {
  id: ID!
  email: String
}

type Query {
  # Items
  items: [Item]
}
```

## GraphQL Types

SubKit provides all types of the [GraphQL specification](http://facebook.github.io/graphql/October2016/#sec-Types). Additionally the [JSON type](https://github.com/taion/graphql-type-json) is supported.

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

### Additionally supprted types

* [JSON](https://github.com/taion/graphql-type-json)

## Implement query resolver functions

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

## Usage of resolver function context

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

## Usage of GraphQL query variables

The variable definitions are the part that looks like ($id: ID!) in the query above. It works just like the argument definitions for a function in a typed language. All declared variables must be either scalars, enums, or input object types. Variable definitions can be optional or required. When default values are provided for all variables, you can call the query without passing any variables. If any variables are passed as part of the variables dictionary, they will override the defaults.

Usage of query variables:

```graphql
query loadItem($id: ID = "subkitio") {
  item(id: $id) {
    id
    email
  }
}
```

```json
{
  "id": "subkitio"
}
```

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'query loadItem($id: ID!) {item(id: $id) {id email}}' \
  --variables '{"id": "subkitio"}'
```