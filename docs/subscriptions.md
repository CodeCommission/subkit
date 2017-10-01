# Subscriptions

* [Setup and Subscribe to GraphQL-Subscriptions](#graphQL-subscriptions)
* [Use Publish/Subscribe programmatically](#use-publish/subscribe-programmatically)

## GraphQL-Subscriptions

### Schema

```graphql
# ...
type Subscription {
  onItemUpserted: Item
}
# ...
```

### Resolver

```javascript
export const resolvers = {
  // ...
  Subscription: {
    onItemUpserted: (source, args, context, info) => context.loaders.items.load(source.id),
  },
  // ...
}

export const channels = {
  onItemUpserted: (options, args) => ({
    itemsChannel: {filter: event => true},
  }),
}
```

### GraphQL Query

```bash
subkit request --query ''
```

## Use Publish/Subscribe programmatically

```javascript
const {pubsub} = require('subkit');

// subscribe to events by channelName
pubsub.subscribe('channelName', (error, event) => {
  //...
})

// publish event by channelName and payload
pubsub.publish('channelName', {})
```