export const resolvers = {
  Viewer: {
    items: async (parent, args, context, info) => {
      const items = await context.loaders.items();
      return items.filter(x => x.email === context.viewer.id);
    }
  },
  Item: {
    items: (parent, args, context, info) => context.loaders.items()
  },
  Query: {
    item: async (parent, args, context, info) =>
      (await context.loaders.items()).find(x => x.id == args.id),
    items: (parent, args, context, info) => context.loaders.items(),
    viewer: (parent, args, context, info) => args
  },
  Mutation: {
    upsertItem: (parent, args, context, info) => {
      context.pubsub.publish('itemUpsertedChannel', args.input);
      return args.input;
    }
  },
  Subscription: {
    onItemUpserted: async (source, args, context, info) =>
      (await context.loaders.items()).find(x => x.id == source.id)
  }
};

export const loaders = {
  items: async () => [
    {id: 1, email: 'go@subkit.io', value: {some: 'something'}},
    {id: 2},
    {id: 3}
  ]
};

export const channels = {
  onItemUpserted: (options, args) => ({
    itemUpsertedChannel: {filter: event => true}
  })
};

export const directives = {};
