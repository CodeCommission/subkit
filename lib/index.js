const {
  existsSync,
  readFileSync,
  readFile,
  readdirSync,
  exists
} = require("fs-extra");
const { resolve, extname, parse } = require("path");
const {
  addMockFunctionsToSchema,
  makeExecutableSchema,
  addErrorLoggingToSchema,
  mergeSchemas
} = require("graphql-tools");
const GraphQLJSON = require("graphql-type-json");
const { addCustomDirectivesToSchema } = require("./custom-directives");
const { mock, fetchJSON, publish, execute } = require("./subkit-directives");
const { PubSub } = require("graphql-subscriptions");
const {
  SubscriptionServer,
  SubscriptionManager
} = require("subscriptions-transport-sse");
const { createQueryComplexityValidator } = require("./complexity-validation");

const {
  enableGraphQLExtensions,
  GraphQLExtensionStack
} = require("./extentions");
const { CacheControlExtension } = require("./cache-control-extention");
const { TracingExtension } = require("./tracing-extention");

const express = require("express");
const expressJWT = require("express-jwt");
const expressCors = require("cors");
const expressBodyParser = require("body-parser");
const expressGraphQL = require("express-graphql");

const app = express();
const pubsub = new PubSub();

module.exports = app;
module.exports.pubsub = pubsub;
module.exports.start = ({
  port = null,
  host = "0.0.0.0",
  secret = "",
  mocked = false,
  graphiql = false,
  analysis = 0,
  extentions = false
}) => {
  app.secret = secret;
  app.graphiql = graphiql;
  app.analysis = analysis;
  app.extentions = extentions;
  if (mocked) addMockFunctionsToSchema({ schema, preserveResolvers: true });
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

app.enable("trust proxy");
app.disable("x-powered-by");
app.use(expressCors());
app.use(expressBodyParser.json());

const resolverDefinition = existsSync(
  resolve(process.cwd(), "../../graphql.js")
)
  ? require(resolve(process.cwd(), "../../graphql"))
  : require(resolve(process.cwd(), "./graphql"));

const files = readdirSync(resolve(process.cwd())).concat(
  readdirSync(resolve(process.cwd(), "../.."))
);
const schemaDefinitionFiles = files.filter(x => extname(x) === ".sdl");
const hasMultipleSchemas = schemaDefinitionFiles.length > 1;
const schema = hasMultipleSchemas
  ? mergeSchemas({
      schemas: files
        .map(x => {
          if (extname(x) === ".sdl") {
            const schemaDef = readFileSync(
              resolve(process.cwd(), x)
            ).toString();
            return makeExecutableSchema({
              typeDefs: ["scalar JSON", schemaDef]
            });
          }
          if (extname(x) === ".sdle") {
            const schemaDef = readFileSync(
              resolve(process.cwd(), x)
            ).toString();
            return schemaDef;
          }
          return null;
        })
        .filter(x => x),
      resolvers: mergeInfo =>
        Object.assign({}, { JSON: GraphQLJSON }, resolverDefinition.resolvers)
    })
  : makeExecutableSchema({
      typeDefs: [
        "scalar JSON",
        readFileSync(
          resolve(process.cwd(), schemaDefinitionFiles[0])
        ).toString()
      ],
      resolvers: Object.assign(
        {},
        { JSON: GraphQLJSON },
        resolverDefinition.resolvers
      )
    });

addCustomDirectivesToSchema(
  schema,
  Object.assign(
    {},
    { mock, fetchJSON, publish, execute },
    resolverDefinition.directives
  )
);

addErrorLoggingToSchema(schema, {
  log: e =>
    console.error(
      JSON.stringify({
        message: e.message,
        error: e,
        stack: e.stack,
        type: "Error"
      })
    )
});

SubscriptionServer(
  {
    onSubscribe: (msg, params) =>
      Object.assign({}, params, {
        context: { loaders: resolverDefinition.loaders }
      }),
    subscriptionManager: new SubscriptionManager({
      schema,
      pubsub,
      setupFunctions: resolverDefinition.channels
    })
  },
  { express: app, path: "/subscriptions" }
);

app.use("/graphql", (req, res, next) => {
  if (Boolean(app.graphiql)) {
    return express.static(parse(require.resolve("subkit-graphiql")).dir)(
      req,
      res,
      next
    );
  }
  next();
});

app.use(
  "/graphql",
  (req, res, next) =>
    app.secret
      ? expressJWT({
          secret: app.secret,
          credentialsRequired: true
        })(req, res, next)
      : next(),
  (req, res, next) => {
    if (!req.body.operationName) return next();
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
        ? ({ document, variables, operationName, result }) => {
            extensionStack.executionDidEnd();
            extensionStack.requestDidEnd();
            const extensionsFormat = extensionStack.format();
            const durationHrTime = process.hrtime(startHrTime);

            return {
              duration: durationHrTime[0] * 1e9 + durationHrTime[1],
              score: req._runTimeQueryComplexity,
              scoreMax: app.analysis || undefined,
              isPersistent: req._isPersistent,
              cache: extensionsFormat.cacheControl,
              trace: extensionsFormat.tracing
            };
          }
        : undefined,
      context: {
        loaders: resolverDefinition.loaders,
        user: req.user,
        pubsub,
        variables: req.body.variables,
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
  console.error(
    JSON.stringify({
      message: e.message,
      error: e,
      stack: e.stack,
      type: "Error"
    })
  );
  if (e.name === "UnauthorizedError") return res.sendStatus(401);
});
