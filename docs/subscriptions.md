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
    onItemUpserted: (source, args, context, info) => context.loaders.items.find(x => x.id === source.id)
  },
  // ...
}

export const channels = {
  // ...
  // implementation of event handler and event filter for the pub/sub channel
  onItemUpserted: (options, args) => ({
    itemUpsertedChannel: {filter: event => true},
  }),
  // ...
}
```

### GraphQL Query

```bash
subkit request \
  --token eyJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImdvQHN1YmtpdC5pbyJ9.-cVh3sNNCqCZZGdS2jwL_u3aJKXZqNippsMSxj15ROk \
  --url http://localhost:8080/graphql \
  --query 'subscription onItemUpserted {onItemUpserted {id email}}'
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