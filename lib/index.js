const {
  existsSync,
  readFileSync,
  readFile,
  readdirSync,
  exists,
  createReadStream
} = require('fs-extra');
const {resolve, extname, parse} = require('path');
const {
  addMockFunctionsToSchema,
  makeExecutableSchema,
  addErrorLoggingToSchema,
  mergeSchemas
} = require('graphql-tools');
const GraphQLJSON = require('graphql-type-json');
const {addCustomDirectivesToSchema} = require('./custom-directives');
const subkitDirectives = require('./subkit-directives');
const {PubSub} = require('graphql-subscriptions');
const {
  SubscriptionServer,
  SubscriptionManager
} = require('subscriptions-transport-sse');
const {createQueryComplexityValidator} = require('./complexity-validation');

const {
  enableGraphQLExtensions,
  GraphQLExtensionStack
} = require('./extentions');
const {CacheControlExtension} = require('./cache-control-extention');
const {TracingExtension} = require('./tracing-extention');

const express = require('express');
const expressJWT = require('express-jwt');
const expressCors = require('cors');
const expressBodyParser = require('body-parser');
const expressGraphQL = require('express-graphql');
const morgan = require('morgan');
const morganJSON = require('morgan-json');

const app = express();
const pubsub = new PubSub();

module.exports = app;
module.exports.pubsub = pubsub;
module.exports.start = ({
  port = null,
  host = '0.0.0.0',
  secret = '',
  mocked = false,
  graphiql = false,
  analysis = 0,
  extentions = false,
  logFormat = 'json',
  logStyle = 'extended'
}) => {
  app.secret = secret;
  app.graphiql = graphiql;
  app.analysis = analysis;
  app.extentions = extentions;
  app.logFormat = logFormat.toLowerCase();
  app.logStyle = logStyle.toLowerCase();
  if (mocked) addMockFunctionsToSchema({schema, preserveResolvers: true});
  return new Promise(resolve => {
    module.exports.server = app.listen(port, () =>
      resolve({
        url: `http://${host}:${module.exports.server.address().port}/graphql`,
        isSecure: Boolean(secret)
      })
    );
  });
};
module.exports.stop = () =>
  new Promise(resolve => module.exports.server.close(() => resolve()));

app.enable('trust proxy');
app.disable('x-powered-by');
app.use(expressCors());
app.use(expressBodyParser.json());

morgan.token('bodyJSON', req => JSON.stringify(req.body || {}));
morgan.token('extentionsJSON', (_, res) =>
  JSON.stringify(res._extensions || {})
);
morgan.token('errorsJSON', (_, res) => JSON.stringify(res._errors || {}));
morgan.token('operationName', req => req.body.operationName);

app.use((req, res, next) => {
  if (app.logStyle !== 'none') {
    if (app.logFormat === 'json') {
      if (app.logStyle === 'extended')
        return morgan(
          morganJSON({
            timestamp: ':date[iso]',
            method: ':method',
            url: ':url',
            status: ':status',
            length: ':res[content-length]',
            responseTimeMs: ':response-time',
            remoteAddr: ':remote-addr',
            userAgent: ':user-agent',
            operation: ':operationName',
            bodyJSON: ':bodyJSON',
            extentionsJSON: ':extentionsJSON',
            errorsJSON: ':errorsJSON'
          })
        )(req, res, next);
      if (app.logStyle === 'short')
        return morgan(
          morganJSON({
            timestamp: ':date[iso]',
            method: ':method',
            url: ':url',
            status: ':status',
            length: ':res[content-length]',
            responseTimeMs: ':response-time',
            remoteAddr: ':remote-addr',
            userAgent: ':user-agent',
            operation: ':operationName'
          })
        )(req, res, next);
    }
    if (app.logFormat === 'text') {
      if (app.logStyle === 'extended')
        return morgan(
          ':date[iso] :method :url :status: :res[content-length] :response-time :remote-addr :user-agent :operationName :bodyJSON :extentionsJSON :errorsJSON'
        )(req, res, next);
      if (app.logStyle === 'short')
        return morgan(
          ':date[iso] :method :url :status: :res[content-length] :response-time :remote-addr :user-agent :operationName'
        )(req, res, next);
    }
  }
  next();
});

const resolverDefinition = existsSync(
  resolve(process.cwd(), '../../graphql.js')
)
  ? require(resolve(process.cwd(), '../../graphql'))
  : require(resolve(process.cwd(), './graphql'));

const files = readdirSync(resolve(process.cwd())).concat(
  readdirSync(resolve(process.cwd(), '../..'))
);
const schemaDefinitionFiles = files
  .filter(x => extname(x) === '.sdl')
  .map(x => readFileSync(resolve(process.cwd(), x)).toString())
  .filter(x => x);

const schema = makeExecutableSchema({
  typeDefs: ['scalar JSON'].concat(schemaDefinitionFiles),
  resolvers: Object.assign(
    {},
    {JSON: GraphQLJSON},
    resolverDefinition.resolvers
  )
});

addCustomDirectivesToSchema(
  schema,
  Object.assign({}, subkitDirectives, resolverDefinition.directives)
);

addErrorLoggingToSchema(schema, {
  log: e => {
    if (app.logFormat === 'text') return console.error(e.message);
    if (app.logFormat === 'json')
      return console.error(
        JSON.stringify({
          message: e.message,
          error: e,
          stack: e.stack,
          type: 'Error'
        })
      );
  }
});

app.use('/graphql', (req, res, next) => {
  if (Boolean(app.graphiql)) {
    return express.static(parse(require.resolve('subkit-graphiql')).dir)(
      req,
      res,
      next
    );
  }
  next();
});

app.use(
  (req, res, next) =>
    app.secret
      ? expressJWT({
          secret: app.secret,
          credentialsRequired: true,
          getToken: req => {
            if (
              req.headers.authorization &&
              req.headers.authorization.split(' ')[0] === 'Bearer'
            ) {
              return req.headers.authorization.split(' ')[1];
            } else if (req.query && req.query.token) {
              return req.query.token;
            }
            return null;
          }
        })(req, res, next)
      : next()
);

SubscriptionServer(
  {
    onSubscribe: req => {
      const context = {
        logFormat: app.logFormat,
        logStyle: app.logStyle,
        variables: req.body.variables,
        user: req.user,
        loaders: resolverDefinition.loaders,
        pubsub,
        headers: req.headers,
        env: process.env
      };

      Object.keys(schema._subscriptionType._fields).forEach(x => {
        const field = schema._subscriptionType._fields[x];
        field.astNode.directives.forEach(y => {
          if (!y) return;

          const fieldDirective = y.name.value;
          if (!fieldDirective) return;

          const directive = schema._directives.find(
            x => x.name === fieldDirective
          );
          if (!directive) return;

          const fieldArgs = y.arguments.reduce((s, e) => {
            s[e.name.value] = e.value.value;
            return s;
          }, {});

          const subscription = directive.resolve();

          resolverDefinition.channels[x] = (options, args) => ({
            [fieldArgs.topic]: {
              filter: (event, ctx) =>
                subscription.filter(
                  event,
                  Object.assign({}, args, fieldArgs),
                  Object.assign({}, ctx, context)
                )
            }
          });

          const defer = field.resolve;
          field.resolve = (source, args, context, info) =>
            Promise.resolve(defer(source, args, context, info)).then(data =>
              subscription.resolve(
                Object.assign({}, source, data),
                Object.assign({}, args, fieldArgs),
                context,
                info
              )
            );

          return subscription.subscribe(null, fieldArgs, context, field);
        });
      });

      return Object.assign({}, req.params, {
        context
      });
    },
    subscriptionManager: new SubscriptionManager({
      schema,
      pubsub,
      setupFunctions: resolverDefinition.channels
    })
  },
  {express: app, path: '/subscriptions'}
);

app.get('/metric', (req, res, next) =>
  createReadStream(resolve(process.cwd(), 'metric.json'), {flags: 'a+'}).pipe(
    res
  )
);

app.use(
  '/graphql',
  (req, res, next) => {
    if (!req.body.operationName) return next();
    if (req.body.query) return next();
    const persistentQueryFilePath = resolve(
      process.cwd(),
      `${req.body.operationName}.gql`
    );
    exists(persistentQueryFilePath).then(isPersistentFileExists => {
      if (req.body.operationName && isPersistentFileExists) {
        readFile(persistentQueryFilePath).then(fileContent => {
          req.body.query = fileContent.toString();
          req._isPersistent = true;
          next();
        });
      } else {
        next();
      }
    });
  },
  (req, res, next) => {
    const startHrTime = process.hrtime();
    const cacheControlExtension = new CacheControlExtension();
    const tracingExtension = new TracingExtension();
    const extensionStack = new GraphQLExtensionStack([
      cacheControlExtension,
      tracingExtension
    ]);
    enableGraphQLExtensions(schema);
    extensionStack.requestDidStart();
    extensionStack.executionDidStart();

    return expressGraphQL({
      schema: schema,
      graphiql: false,
      pretty: Boolean(app.graphiql),
      rootValue: {},
      extensions: app.extentions
        ? ({document, variables, operationName, result}) => {
            extensionStack.executionDidEnd();
            extensionStack.requestDidEnd();
            const extensionsFormat = extensionStack.format();
            const durationHrTime = process.hrtime(startHrTime);

            const extentions = {
              duration: durationHrTime[0] * 1e9 + durationHrTime[1],
              score: req._runTimeQueryComplexity,
              scoreMax: app.analysis || undefined,
              isPersistent: req._isPersistent,
              cache: extensionsFormat.cacheControl,
              trace: extensionsFormat.tracing
            };
            res._errors = result.errors;
            res._extensions = extentions;
            return extentions;
          }
        : undefined,
      context: {
        loaders: resolverDefinition.loaders,
        user: req.user,
        headers: req.headers,
        logFormat: app.logFormat,
        logStyle: app.logStyle,
        pubsub,
        variables: req.body.variables,
        env: process.env,
        _extensionStack: extensionStack
      },
      formatError: error => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack,
        path: error.path
      }),
      validationRules: [
        app.analysis
          ? createQueryComplexityValidator({
              maximumComplexity: app.analysis,
              variables: req.body.variables,
              onComplete: complexity =>
                (req._runTimeQueryComplexity = complexity)
            })
          : () => ({})
      ]
    })(req, res, next);
  }
);

app.use((e, req, res, next) => {
  if (e.name === 'UnauthorizedError') return res.sendStatus(401);
  if (app.logStyle !== 'none') {
    if (app.logFormat === 'text') return console.error(e.message);
    if (app.logFormat === 'json')
      return console.error(
        JSON.stringify({
          message: e.message,
          error: e,
          stack: e.stack,
          type: 'Error'
        })
      );
  }
});
