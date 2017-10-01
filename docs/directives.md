# Directives

GraphQL directives are an extremely powerful mechanism to customize query responses and execution behavior in a declarative way. SubKit GraphQL-Server provides 3 kinds of GraphQL schema directives:

* [GraphQL specification](http://facebook.github.io/graphql/October2016/#sec-Type-System.Directives)
  * @skip
  * @include
* [SubKit build-in](#subkit-build-in)
  * @mock
  * @fetchJSON
  * @publish
  * @timeLog
* [Custom directives for GraphQL queries](#custom-directives-for-graphql-queries)

## SubKit build-in

### @mock

Mock field data.

`@mock(value: JSON)`

* **value** - Mock data to result in query.

### @mock examples

```graphql
query loadItem {
  item(id: "mikebild") {
    id
    email @mock(value: "go@linklet.run")
    picture @mock(value: {link: "https://www.gravatar.com/avatar/ddec25b3a317217b97ffc45a62ae8980"}) {
      link
    }
  }
}
```

```graphql
query loadItem {
  item(id: "mikebild") {
    id
    email @mock(value: "go@linklet.run")
    picture {
      link
    }
  }
}
```

```graphql
query loadItem {
  item(id: "mikebild") {
    id
    email @mock(value: "go@subkit.io")
    picture @mock(value: {link: "https://subkit.io"}) {
      link @mock(value: "https://github.com/codecommission/subkit")
    }
  }
}
```

### @fetchJSON

Publish an event to subscriptions by channelName.

`@@fetchJSON(url: String!, jsonQuery: String, timeout: Int)`

* **url** - [ES6 template strings](https://www.npmjs.com/package/es6-template-strings) provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.

#### @fetchJSON examples

```graphql
query loadItem {
  item(id: "mikebild") {
    id
    email @mock(value: "go@subkit.io")
    picture @mock(value: {link: "https://subkit.io"}) {
      link @mock(value: "https://github.com/codecommission/subkit")
    }
    profile @fetchJSON(url: "https://de.gravatar.com/${id}.json", jsonQuery: "entry[0]", timeout: 10) {
      id
      profileUrl
    }
  }
}
```

### @publish

Publish an event to subscriptions by channelName.

`@publish(channelName: String!, payload: JSON)`

* **channelName** - Name of subscription channel of the published event.
* **payload** - Mock payload data of event, otherwise input data is the payload of the published event.

#### @publish examples

Publish event to **itemsChannel** with **mock payload** after successful mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "mikebild", email: "mike@mikebild.com"}) @publish(channelName: "itemsChannel", payload: {id: "mikebild"}) {
    id
    email
  }
}
```

Publish event to itemsChannel with input payload after successful mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "mikebild", email: "mike@mikebild.com"}) @publish(channelName: "itemsChannel"}) {
    id
    email
  }
}
```

### @timeLog

Console output of query resolve time on field level in ms.

```graphql
query loadItem {
  item(id: "mikebild") {
    id @timeLog
  }
}
```

```bash
Resolve time for Item.id: 1ms
```

## Custom-Directives for GraphQL-Queries

### `@toUpperCase`

Implement a custom `@toUpperCase` directive without arguments.

```javascript
const {DirectiveLocation} = require('graphql/type/directives')

export const directives = {
  // ...
  toUpperCase: {
    description: 'Transform result to uppercase.',
    locations: [DirectiveLocation.FIELD],
    resolve: (resolve, parent, args, ctx, info) => resolve().then(result => result.toUpperCase()),
  },
  // ...
}
```

GraphQL query using `@toUpperCase` directive.

```graphql
query loadItem {
  item(id: "mikebild") {
    # Apply @toUpperCase directive on id field
    id @toUpperCase
  }
}
```

### `@toFormatString` Custom GraphQL directive

Implement a custom `@toFormatString` directive with arguments.

```javascript
const {GraphQLString, GraphQLNonNull} = require('graphql')
const {DirectiveLocation} = require('graphql/type/directives')
const format = require('es6-template-strings')

export const directives = {
  // ...
  toFormatString: {
    description: 'Transform result to ES6 template string.',
    locations: [DirectiveLocation.FIELD],
    args: {template: {type: new GraphQLNonNull(GraphQLString)}, parent: {type: GraphQLBoolean}},
    resolve: (resolve, parent, args, ctx, info) => resolve().then(result => format(args.template, args.parent ? parent : {[`${info.fieldName}`]: result})),
  },
  // ...
}
```

GraphQL query using `@toFormatString` directive.

```graphql
query loadItem {
  item(id: "mikebild") {
    # Apply @toFormatString directive on id field
    id @toFormatString(template: "user-${id}")
  }
}
```