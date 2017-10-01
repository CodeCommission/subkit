const {GraphQLString, GraphQLInt, GraphQLNonNull} = require('graphql')
const GraphQLJSON = require('graphql-type-json')
const {DirectiveLocation} = require('graphql/type/directives')
const jsonQuery = require('json-query')
const format = require('es6-template-strings')

const mock = {
  description: 'Mock resolver results via JSON.',
  locations: [DirectiveLocation.FIELD],
  args: {value: {type: new GraphQLNonNull(GraphQLJSON)}},
  resolve: (resolve, parent, args, ctx, info) => {
    if(parent && parent[info.fieldName]) parent[info.fieldName] = args.value
    return resolve().then(() => args.value)
  },
}

const fetchJSON = {
  description: 'Fetch URL result value e.g. @fetch(url: "https://...").',
  locations: [DirectiveLocation.FIELD],
  args: {url: {type: new GraphQLNonNull(GraphQLString)}, jsonQuery: {type: GraphQLString}, timeout: {type: GraphQLInt}},
  resolve: (resolve, parent, args, ctx, info) => resolve().then(() => fetch(format(args.url, parent), {timeout: args.timeout || 0})
    .then(result => result.json())
    .then(data => args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data)
  ),
}

const timeLog = {
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

const publish = {
  description: 'Publish an event to subscription by channel name.',
  locations: [DirectiveLocation.FIELD],
  args: {channelName: {type: new GraphQLNonNull(GraphQLString)}, payload: {type: GraphQLJSON}},
  resolve: (resolve, parent, args, ctx, info) => resolve().then(result => {
    ctx.pubsub.publish(args.channelName, args.payload || result)
    return result
  }),
}

module.exports = {
  mock,
  fetchJSON,
  timeLog,
  publish,
}