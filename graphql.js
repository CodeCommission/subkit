import { pubsub } from "./lib";
import { GraphQLInt, GraphQLString, GraphQLNonNull } from "graphql";
import { DirectiveLocation } from "graphql/type/directives";

export const resolvers = {
  Item: {
    demos: (parent, args, context, info) => [{ id: 1 }, { id: 2 }]
  },
  Query: {
    item: (parent, args, context, info) =>
      context.loaders.items.find(x => x.id == args.id),
    items: (parent, args, context, info) => context.loaders.items
  },
  Mutation: {
    upsertItem: (parent, args, context, info) => {
      context.pubsub.publish("itemUpsertedChannel", args.input);
      return args.input;
    }
  },
  Subscription: {
    onItemUpserted: (source, args, context, info) =>
      context.loaders.items.find(x => x.id === source.id)
  }
};

export const loaders = {
  items: [{ id: "subkitio", email: "go@subkit.io" }, { id: 2 }, { id: 3 }]
};

export const channels = {
  onItemUpserted: (options, args) => ({
    itemUpsertedChannel: { filter: event => true }
  })
};

export const directives = {};
