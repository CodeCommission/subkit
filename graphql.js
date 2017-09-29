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
    onItemChanged: (parent, args, context, info) => context.loaders.items,
  },
}

export const loaders = {
  items: [{id: 1}, {id: 2}, {id: 3}],
}

export const channels = {
  onItemChanged: (options, args) => ({
    itemChangedChannel: {filter: event => true},
  }),
}

export const directives = {
}
