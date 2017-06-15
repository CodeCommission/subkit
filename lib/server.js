const fs = require('fs');
const path = require('path');
const express = require('express');
const expressCors = require('cors');
const expressGraphQL = require('express-graphql');
const expressBodyParser = require('body-parser');
const app = express();

const graphqlTools = require('graphql-tools');
const schemaDefinition = fs.existsSync(path.resolve(process.cwd(), '../../schema.graphql')) ? fs.readFileSync(path.resolve(process.cwd(), '../../schema.graphql')) : fs.readFileSync(path.resolve(process.cwd(), './schema.graphql'));
const resolverDefinition = fs.existsSync(path.resolve(process.cwd(), '../../resolver.js')) ? require(path.resolve(process.cwd(), '../../resolver')) : require(path.resolve(process.cwd(), './resolver'));

const schema = graphqlTools.makeExecutableSchema({
  typeDefs: schemaDefinition.toString(),
  resolvers: resolverDefinition,
});

app.enable('trust proxy');
app.disable('x-powered-by');
app.use(expressCors());
app.use('/graphql', (req, res, next) => expressGraphQL({
  schema: schema,
  graphiql: true,
  pretty: true,
  context: { loaders: {}, user: req.user, },
})(req, res, next));

app.use(expressBodyParser.json({limit: '10mb'}));

let server = null;
let freePort = null;

module.exports = {
  start: ({port = null, host = '0.0.0.0'}) => {
    return new Promise(resolve => {
      server = app.listen(port, () => resolve({
        url: `http://${host}:${server.address().port}/graphql`,
      }));
    });
  },
  stop: () => new Promise(resolve => server.close(() => resolve())),
};
