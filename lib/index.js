import {existsSync, readFileSync} from 'fs'
import {resolve} from 'path'
import {addMockFunctionsToSchema, makeExecutableSchema, addErrorLoggingToSchema} from 'graphql-tools'
import GraphQLJSON from 'graphql-type-json'
import {addCustomDirectivesToSchema} from './custom-directives'
import {mock, fetchJSON, timeLog, publish} from './subkit-directives'
import {SubscriptionManager, PubSub} from 'graphql-subscriptions'
import expressGraphQLSubscriptionsSSETransport from 'subscriptions-transport-sse'
import express from 'express'
import expressJWT from 'express-jwt'
import expressCors from 'cors'
import expressBodyParser from 'body-parser'
import expressGraphQL from 'express-graphql'

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
