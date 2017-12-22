# Directives

* [Build-In](#subkit-build-in)
  * [@constant](#constant)
  * [@getJSON](#getJSON)
  * [@postJSON](#postJSON)
  * [@putJSON](#putJSON)
  * [@deleteJSON](#deleteJSON)
  * [@publish](#publish)
  * [@subscribe](#subscribe)
  * [@contextify](#contextify)
  * [@map](#map)
  * [@mapInput](#mapInput)
  * [@paged](#paged)
  * [@log](#log)
  * [@execute](#execute)
  * [@spawn](#spawn)
  * [@eventsource](#eventsource)
  * [@cacheControl](#cacheControl)
  * [@complexity](#complexity)
* [Programming Custom-Directives](#programming-custom-directives)

GraphQL directives are an extremely powerful mechanism to customize query
responses and execution behavior in a declarative way. SubKit GraphQL-Server
provides 3 kinds of GraphQL schema directives:

* [GraphQL specification](http://facebook.github.io/graphql/October2016/#sec-Type-System.Directives)
  * @skip
  * @include
* [SubKit build-in](#subkit-build-in)
  * @constant
  * @fetchJSON
  * @publish
* [Custom directives for GraphQL queries](#custom-directives-for-graphql-queries)

## SubKit Build-In

* [@constant](#constant)
* [@getJSON](#getJSON)
* [@postJSON](#postJSON)
* [@putJSON](#putJSON)
* [@deleteJSON](#deleteJSON)
* [@publish](#publish)
* [@contextify](#contextify)

### constant

Constant field data as resolver result.

```graphql
@constant(value: JSON)
```

* **value** - constant data to result in query.

### constant examples

```graphql
query loadItem {
  item(id: "johndoe") {
    id
    email @constant(value: "go@linklet.run")
    picture
      @constant(
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
    email @constant(value: "go@linklet.run")
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
    email @constant(value: "go@subkit.io")
    picture @constant(value: {link: "https://subkit.io"}) {
      link @constant(value: "https://github.com/codecommission/subkit")
    }
  }
}
```

### getJSON

HTTP GET (HTTP header pass-through) from URL as JSON. Executable on fields on client- and
server-side.

```graphql
@getJSON(url: String!, jsonQuery: String, timeout: Int, headers: JSON, catch: Boolean)
```

* **url** -
  [ES6 template string](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the JSON response.
* **timeout** - Set a network timeout in ms.
* **headers** - Set additional HTTP headers.
* **catch** - Enable error catching as null result.

#### getJSON examples

```graphql
query loadItem {
  item(id: "johndoe") {
    id
    email @constant(value: "go@subkit.io")
    picture @constant(value: {link: "https://subkit.io"}) {
      link @constant(value: "https://github.com/codecommission/subkit")
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

HTTP POST (HTTP header pass-through) input data (args.input) to URL using JSON. Executable on mutation
field on client- and server-side.

```graphql
@postJSON(url: String!, jsonQuery: String, timeout: Int, headers: JSON, catch: Boolean)
```

* **url** -
  [ES6 template string](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the JSON response.
* **timeout** - Set a network timeout in ms.
* **headers** - Set additional HTTP headers.
* **catch** - Enable error catching as null result.

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

HTTP PUT (HTTP header pass-through) input data (args.input) to URL using JSON. Executable on mutation field
on client- and server-side.

```graphql
@putJSON(url: String!, jsonQuery: String, timeout: Int, headers: JSON, catch: Boolean)
```

* **url** -
  [ES6 template string](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the JSON response.
* **timeout** - Set a network timeout in ms.
* **headers** - Set additional HTTP headers.
* **catch** - Enable error catching as null result.

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

HTTP DELETE (HTTP header pass-through) input id (args.id) to URL. Executable on mutation field on client-
and server-side.

```graphql
@deleteJSON(url: String!, jsonQuery: String, timeout: Int, headers: JSON, catch: Boolean)
```

* **url** -
  [ES6 template string](https://www.npmjs.com/package/es6-template-strings)
  provided URL to fetch JSON data.
* **jsonQuery** - [JSON Query](https://www.npmjs.com/package/json-query) to
  transform the `@fetchJSON` JSON response.
* **timeout** - Set a network timeout in ms.
* **headers** - Set additional HTTP headers.
* **catch** - Enable error catching as null result.

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

Publish an event to subscriptions by topic.

`@publish(topic: String!, payload: JSON)`

* **topic** - Name of subscription channel of the published event.
* **payload** - constant payload data of event, otherwise input data is the payload
  of the published event.

#### publish examples

Publish event to **itemsChannel** with **constant payload** after successful
mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"})
    @publish(topic: "itemsChannel", payload: {id: "johndoe"}) {
    id
    email
  }
}
```

Publish event to itemsChannel with input payload after successful mutation.

```graphql
mutation upsertItem {
  upsertItem(input: {id: "johndoe", email: "johndoe@example.com"}) @publish(topic: "itemsChannel"}) {
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

## Programming custom directives

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
