const {existsSync, readFileSync} = require('fs')
const {resolve} = require('path')
const {addMockFunctionsToSchema, makeExecutableSchema, addErrorLoggingToSchema} = require('graphql-tools')
const GraphQLJSON = require('graphql-type-json')
const {addCustomDirectivesToSchema} = require('./custom-directives')
const {mock, fetchJSON, timeLog, publish} = require('./subkit-directives')
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
module.exports.start = ({port = null, host = '0.0.0.0', secret = '', mocked = false, graphiql = false}) => {
  app.secret = secret
  app.graphiql = graphiql
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

const schemaDefinition = existsSync(resolve(process.cwd(), '../../graphql.gql'))
  ? readFileSync(resolve(process.cwd(), '../../graphql.gql'))
  : readFileSync(resolve(process.cwd(), './graphql.gql'))
const resolverDefinition = existsSync(resolve(process.cwd(), '../../graphql.js'))
  ? require(resolve(process.cwd(), '../../graphql'))
  : require(resolve(process.cwd(), './graphql'))
const schema = makeExecutableSchema({
  typeDefs: ['scalar JSON', schemaDefinition.toString()],
  resolvers: Object.assign({}, {JSON: GraphQLJSON}, resolverDefinition.resolvers),
})

addCustomDirectivesToSchema(schema, Object.assign({}, {mock, fetchJSON, timeLog, publish}, resolverDefinition.directives))
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
    graphiql: Boolean(app.graphiql),
    pretty: Boolean(app.graphiql),
    rootValue: {},
    context: {
      loaders: resolverDefinition.loaders,
      user: req.user,
      pubsub,
    },
  })(req, res, next))

app.use((err, req, res, next) => {
  console.error(JSON.stringify({error: err.message}))
  if (err.name === 'UnauthorizedError') return res.sendStatus(401)

})
