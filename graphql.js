import {pubsub} from './lib'

export const resolvers = {
  Query: {
    items: (parent, args, context, info) => context.loaders.items,
  },
  Mutation: {
    changeItem: (parent, args, context, info) => {
      context.pubsub.publish('itemChangedChannel', args.input)
      return args.input
    },
  },
  Subscription: {
    onItemChanged: (source, args, context, info) => context.loaders.items.find(x => x.id === source.id)
  },
}

export const loaders = {
  items: [{id: 'subkitio', email: 'go@subkit.io'}, {id: 2}, {id: 3}],
}

export const channels = {
  onItemChanged: (options, args) => ({
    itemChangedChannel: {filter: event => true},
  }),
}

export const directives = {
}
