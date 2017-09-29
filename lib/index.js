const {existsSync, readFileSync} = require('fs')
const {resolve} = require('path')
const {addMockFunctionsToSchema, makeExecutableSchema, addErrorLoggingToSchema} = require('graphql-tools')
const GraphQLJSON = require('graphql-type-json')
const {addCustomDirectivesToSchema} = require('./custom-directives')
const subkitDirectives = require('./subkit-directives')
const {SubscriptionManager, PubSub} = require('graphql-subscriptions')
const expressGraphQLSubscriptionsSSETransport = require('subscriptions-transport-sse')
const express = require('express')
const expressJWT = require('express-jwt')
const expressCors = require('cors')
const expressBodyParser = require('body-parser')
const expressGraphQL = require('express-graphql')
const app = express()
const pubsub = new PubSub()

module.exports = app
module.exports.pubsub = pubsub
module.exports.start = ({port = null, host = '0.0.0.0', secret = '', mocked = false}) => {
  app.secret = secret
  if(mocked) addMockFunctionsToSchema({schema, preserveResolvers: true})
  return new Promise(resolve => {
    module.exports.server = app.listen(port, () => resolve({
      url: `http://${host}:${module.exports.server.address().port}/graphql`,
      isSecure: Boolean(secret),
    }))
  })
}
module.exports.stop =  () => new Promise(resolve => module.exports.server.close(() => resolve()))

app.enable('trust proxy')
app.disable('x-powered-by')
app.use(expressCors())
app.use(expressBodyParser.json())

const schemaDefinition = existsSync(resolve(process.cwd(), '../../graphql.idl'))
  ? readFileSync(resolve(process.cwd(), '../../graphql.idl'))
  : readFileSync(resolve(process.cwd(), './graphql.idl'))
const resolverDefinition = existsSync(resolve(process.cwd(), '../../graphql.js'))
  ? require(resolve(process.cwd(), '../../graphql'))
  : require(resolve(process.cwd(), './graphql'))
const schema = makeExecutableSchema({
  typeDefs: ['scalar JSON', schemaDefinition.toString()],
  resolvers: Object.assign({}, {JSON: GraphQLJSON}, resolverDefinition.resolvers),
})

addCustomDirectivesToSchema(schema, Object.assign({}, subkitDirectives, resolverDefinition.directives))
addErrorLoggingToSchema(schema, {log: e => console.error(JSON.stringify({message: e.message, error: e, stack: e.stack}))})

expressGraphQLSubscriptionsSSETransport.SubscriptionServer({
  onSubscribe: (msg, params) => Object.assign({}, params, {context: {loaders: resolverDefinition.loaders}}),
  subscriptionManager: new SubscriptionManager({schema, pubsub, setupFunctions: resolverDefinition.channels}),
}, {express: app, path: '/subscriptions'})

app.use('/graphql',
  (req, res, next) => app.secret
    ? expressJWT({
        secret: app.secret,
        credentialsRequired: true
      })(req, res, next)
    : next(),
  (req, res, next) => expressGraphQL({
    schema: schema,
    graphiql: true,
    pretty: true,
    rootValue: {},
    context: {
      loaders: resolverDefinition.loaders,
      user: req.user,
      pubsub,
    },
  })(req, res, next))

app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') return res.sendStatus(401)
})
