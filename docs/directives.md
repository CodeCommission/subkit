# Directives

* [Build-In](#subkit-build-in)
  * [@mock](#mock)
  * [@fetchJSON / @getJSON](#fetchJSON-getJSON)
  * [@postJSON](#postJSON)
  * [@putJSON](#putJSON)
  * [@deleteJSON](#deleteJSON)
  * [@publish](#publish)
  * [@contextify](#contextify)
* [Programming Custom-Directives](#programming-custom-directives)

GraphQL directives are an extremely powerful mechanism to customize query
responses and execution behavior in a declarative way. SubKit GraphQL-Server
provides 3 kinds of GraphQL schema directives:

* [GraphQL specification](http://facebook.github.io/graphql/October2016/#sec-Type-System.Directives)
  * @skip
  * @include
* [SubKit build-in](#subkit-build-in)
  * @mock
  * @fetchJSON
  * @publish
* [Custom directives for GraphQL queries](#custom-directives-for-graphql-queries)

## SubKit Build-In

* [@mock](#mock)
* [@fetchJSON / @getJSON](#fetchJSON-getJSON)
* [@postJSON](#postJSON)
* [@putJSON](#putJSON)
* [@deleteJSON](#deleteJSON)
* [@publish](#publish)
* [@contextify](#contextify)

### mock

Mock field data.

```graphql
@mock(value: JSON)
```

* **value** - Mock data to result in query.

### mock examples

```graphql
query loadItem {
  item(id: "johndoe") {
    id
    email @mock(value: "go@linklet.run")
    picture
      @mock(
        value: {
          link: "https://www.gravatar.com/avatar/ddec25b3a317217b97ffc45a62ae8980"
        }
      ) {
      link
    }
  }
}
```

```graphql
query loadItem {
  item(id: "johndoe") {
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
  item(id: "johndoe") {
    id
    email @mock(value: "go@subkit.io")
    picture @mock(value: {link: "https://subkit.io"}) {
      link @mock(value: "https://github.com/codecommission/subkit")
    }
  }
}
```

### fetchJSON / getJSON

Fetch / get data from URL as JSON. Executable on fields on client- and
server-side.

```graphql
@fetchJSON(url: String!, jsonQuery: String, timeout: Int)
@getJSON(url: String!, jsonQuery: String, timeout: Int)
```

* **url** -
  [ES6 template strings](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.
* **jwt** - Set to "pass" for JWT passthrough, else given JWT content.

#### fetchJSON / getJSON examples

```graphql
query loadItem {
  item(id: "johndoe") {
    id
    email @mock(value: "go@subkit.io")
    picture @mock(value: {link: "https://subkit.io"}) {
      link @mock(value: "https://github.com/codecommission/subkit")
    }
    profile
      @fetchJSON(
        url: "https://de.gravatar.com/${id}.json"
        jsonQuery: "entry[0]"
        timeout: 10
      ) {
      id
      profileUrl
    }
  }
}
```

### postJSON

HTTP POST input data (args.input) to URL using JSON. Executable on mutation
field on client- and server-side.

```graphql
@postJSON(url: String!, jsonQuery: String, timeout: Int)
```

* **url** -
  [ES6 template strings](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.
* **jwt** - Set to "pass" for JWT passthrough, else given JWT content.

#### postJSON examples

**Client-Side**

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"})
    @postJSON(url: "http://localhost:3000", timeout: 1000) {
    id
    email
  }
}
```

**Server-Side**

```graphql
type Mutation {
  # Insert or update an item
  upsertItem(input: ItemInput!): Item
    @postJSON(url: "http://localhost:3000", timeout: 1000)
}
```

### putJSON

HTTP PUT input data (args.input) to URL using JSON. Executable on mutation field
on client- and server-side.

```graphql
@putJSON(url: String!, jsonQuery: String, timeout: Int)
```

* **url** -
  [ES6 template strings](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.
* **jwt** - Set to "pass" for JWT passthrough, else given JWT content.

#### putJSON examples

**Client-Side**

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"})
    @putJSON(url: "http://localhost:3000/${args.input.id}", timeout: 1000) {
    id
    email
  }
}
```

**Server-Side**

```graphql
type Mutation {
  # Insert or update an item
  upsertItem(input: ItemInput!): Item
    @putJSON(url: "http://localhost:3000/${args.input.id}", timeout: 1000)
}
```

### deleteJSON

HTTP DELETE input id (args.id) to URL. Executable on mutation field on client-
and server-side.

```graphql
@deleteJSON(url: String!, jsonQuery: String, timeout: Int)
```

* **url** -
  [ES6 template strings](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.
* **jwt** - Set to "pass" for JWT passthrough, else given JWT content.

#### deleteJSON examples

**Client-Side**

```graphql
mutation deleteItem {
  deleteItem(id: "johndoe")
    @deleteJSON(url: "http://localhost:3000/${args.id}", timeout: 1000) {
    id
    email
  }
}
```

**Server-Side**

```graphql
type Mutation {
  # Insert or update an item
  deleteItem(id: ID!): Item
    @deleteJSON(url: "http://localhost:3000/${args.id}", timeout: 1000)
}
```

### publish

Publish an event to subscriptions by channelName.

`@publish(channelName: String!, payload: JSON)`

* **channelName** - Name of subscription channel of the published event.
* **payload** - Mock payload data of event, otherwise input data is the payload
  of the published event.

#### publish examples

Publish event to **itemsChannel** with **mock payload** after successful
mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"})
    @publish(channelName: "itemsChannel", payload: {id: "johndoe"}) {
    id
    email
  }
}
```

Publish event to itemsChannel with input payload after successful mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"}) @publish(channelName: "itemsChannel"}) {
    id
    email
  }
}
```

### contextify

Temporary store field data in context and use it later in the execution process.

`@contextify`

#### contextify examples

Contextify the result of viewer field to use it in subordinate field resolvers.

```graphql
query ItemsByViewer {
  viewer(id: "go@subkit.io") @contextify {
    items {
      id
    }
  }
}
```

```javascript
export const resolvers = {
  Viewer: {
    items: async (parent, args, context, info) => {
      const items = await context.loaders.items();
      return items.filter(x => x.email === context.viewer.id);
    }
  }
};
```

## Programming Custom-Directives

### toUpperCase

Implement a custom `@toUpperCase` directive without arguments.

```javascript
const {DirectiveLocation} = require('graphql/type/directives');

export const directives = {
  // ...
  toUpperCase: {
    description: 'Transform result to uppercase.',
    locations: [DirectiveLocation.FIELD],
    resolve: (resolve, parent, args, ctx, info) =>
      resolve().then(result => result.toUpperCase())
  }
  // ...
};
```

GraphQL query using `@toUpperCase` directive.

```graphql
query loadItem {
  item(id: "johndoe") {
    # Apply @toUpperCase directive on id field
    id @toUpperCase
  }
}
```

### `@toFormatString` Custom GraphQL directive

Implement a custom `@toFormatString` directive with arguments.

```javascript
const {GraphQLString, GraphQLNonNull} = require('graphql');
const {DirectiveLocation} = require('graphql/type/directives');
const format = require('es6-template-strings');

export const directives = {
  // ...
  toFormatString: {
    description: 'Transform result to ES6 template string.',
    locations: [DirectiveLocation.FIELD],
    args: {
      template: {type: new GraphQLNonNull(GraphQLString)},
      parent: {type: GraphQLBoolean}
    },
    resolve: (resolve, parent, args, ctx, info) =>
      resolve().then(result =>
        format(
          args.template,
          args.parent ? parent : {[`${info.fieldName}`]: result}
        )
      )
  }
  // ...
};
```

GraphQL query using `@toFormatString` directive.

```graphql
query loadItem {
  item(id: "johndoe") {
    # Apply @toFormatString directive on id field
    id @toFormatString(template: "user-${id}")
  }
}
```
