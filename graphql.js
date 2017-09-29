import {pubsub} from './lib'
import fetch from 'node-fetch'
import {GraphQLString, GraphQLInt} from 'graphql';
import {DirectiveLocation} from 'graphql/type/directives';

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
  fetch: {
    description: 'fetch URL result value e.g. @fetch(url: "https://dropstack-mapping-example.services.dropstack.run/hellos")',
    locations: [DirectiveLocation.FIELD],
    args: {url: {type: GraphQLString}, timeout: {type: GraphQLInt}},
    resolve: async (resolve, parent, args, ctx, info) => await resolve().then(() => fetch(args.url, {timeout: args.timeout || 0}).then(result => result.json())),
  },
  resolverTimeLog: {
    description: 'Log resolver time',
    locations: [DirectiveLocation.FIELD],
    resolve: (resolve, parent, args, ctx, info) => {
      const start = new Date();
      return resolve().then(data => {
        const diff = (new Date() - start);
        console.log(`Log - resolver time [${info.parentType} / ${info.fieldName}]: ${diff}ms`)
        return data;
      })
    }
  },
}
