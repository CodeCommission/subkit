import {GraphQLString, GraphQLInt} from 'graphql'
import GraphQLJSON from 'graphql-type-json'
import {DirectiveLocation} from 'graphql/type/directives'

export const mock = {
  description: 'Mock resolver results via JSON.',
  locations: [DirectiveLocation.FIELD],
  args: {value: {type: GraphQLJSON}},
  resolve: (resolve, parent, args, ctx, info) => resolve().then(() => args.value),
}

export const fetchJSON = {
  description: 'Fetch URL result value e.g. @fetch(url: "https://dropstack-mapping-example.services.dropstack.run/hellos").',
  locations: [DirectiveLocation.FIELD],
  args: {url: {type: GraphQLString}, timeout: {type: GraphQLInt}},
  resolve: (resolve, parent, args, ctx, info) => resolve().then(() => fetch(args.url, {timeout: args.timeout || 0}).then(result => result.json())),
}

export const timeLog = {
  description: 'Resolve time in ms.',
  locations: [DirectiveLocation.FIELD],
  resolve: (resolve, parent, args, ctx, info) => {
    const start = new Date()
    return resolve().then(data => {
      const diff = (new Date() - start)
      console.log(`Resolve time for ${info.parentType}.${info.fieldName}: ${diff}ms`)
      return data
    })
  }
}

export const publish = {
  description: 'Publish an event to subscription by channel name.',
  locations: [DirectiveLocation.FIELD],
  args: {channelName: {type: GraphQLString}, payload: {type: GraphQLJSON}},
  resolve: (resolve, parent, args, ctx, info) => resolve().then(result => {
    ctx.pubsub.publish(args.channelName, args.payload || result)
    return result
  }),
}