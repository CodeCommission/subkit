const { existsSync, readFileSync, readdirSync } = require("fs");
const { resolve, extname, parse } = require("path");
const {
  addMockFunctionsToSchema,
  makeExecutableSchema,
  addErrorLoggingToSchema,
  mergeSchemas
} = require("graphql-tools");
const GraphQLJSON = require("graphql-type-json");
const { addCustomDirectivesToSchema } = require("./custom-directives");
const {
  mock,
  fetchJSON,
  timeLog,
  publish,
  execute
} = require("./subkit-directives");
const { PubSub } = require("graphql-subscriptions");
const {
  SubscriptionServer,
  SubscriptionManager
} = require("subscriptions-transport-sse");
const queryComplexity = require("graphql-query-complexity").default;
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
  analysis = 0
}) => {
  app.secret = secret;
  app.graphiql = graphiql;
  app.analysis = analysis;
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
    { mock, fetchJSON, timeLog, publish, execute },
    resolverDefinition.directives
  )
);
addErrorLoggingToSchema(schema, {
  log: e =>
    console.error(
      JSON.stringify({ message: e.message, error: e, stack: e.stack })
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
    const startTime = Date.now();
    let runTimeQueryComplexity = null;

    return expressGraphQL({
      schema: schema,
      graphiql: false,
      pretty: Boolean(app.graphiql),
      rootValue: {},
      extensions: ({ document, variables, operationName, result }) => {
        return {
          queryRunTime: Date.now() - startTime,
          queryComplexity: runTimeQueryComplexity
        };
      },
      context: {
        loaders: resolverDefinition.loaders,
        user: req.user,
        pubsub,
        variables: req.body.variables
      },
      formatError: error => ({
        message: error.message,
        locations: error.locations,
        stack: error.stack,
        path: error.path
      }),
      validationRules: [
        app.analysis
          ? queryComplexity({
              maximumComplexity: app.analysis,
              variables: req.body.variables,
              onComplete: complexity => {
                runTimeQueryComplexity = complexity;
              }
            })
          : () => ({})
      ]
    })(req, res, next);
  }
);

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ error: err.message, stack: err.stack }));
  if (err.name === "UnauthorizedError") return res.sendStatus(401);
});
