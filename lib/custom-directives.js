const { GraphQLDirective } = require("graphql/type/directives");
const { GraphQLSchema, parse } = require("graphql");
const GraphQLJSON = require("graphql-type-json");

const DEFAULT_DIRECTIVES = ["skip", "include", "deprecated", "complexity"];

function defaultResolveFn(source, args, context, info) {
  const fieldName = info.fieldName;
  if (typeof source === "object" || typeof source === "function") {
    return typeof source[fieldName] === "function"
      ? source[fieldName]()
      : source[fieldName];
  }
}

function resolveWithDirective(resolve, source, directive, context, info) {
  const directiveConfig = info.schema._directives.filter(
    d => directive.name.value === d.name
  )[0];

  let args = {};
  for (const arg of directive.arguments) {
    args[arg.name.value] =
      arg.value.value || GraphQLJSON.parseLiteral(arg.value);
  }
  args = Object.assign({}, args, context.variables);
  return (
    directiveConfig &&
    directiveConfig.resolve &&
    directiveConfig.resolve(resolve, source, args, context, info)
  );
}

function resolverMiddlewareWrapper(
  resolve = defaultResolveFn,
  directives = {}
) {
  const serverDirectives = Object.keys(directives).map(x => directives[x]);
  return (source, args, context, info) => {
    const directives = serverDirectives.concat(
      (info.fieldASTs || info.fieldNodes)[0].directives
    );
    const directive = directives.filter(
      d => DEFAULT_DIRECTIVES.indexOf(d.name.value) === -1
    )[0];

    if (!directive) return resolve(source, args, context, info);
    let defer = resolveWithDirective(
      () => Promise.resolve(resolve(source, args, context, info)),
      source,
      directive,
      context,
      info
    );

    if (directives.length <= 1) return defer;

    for (const directiveNext of directives.slice(1)) {
      defer = defer.then(result =>
        resolveWithDirective(
          () => Promise.resolve(result),
          source,
          directiveNext,
          context,
          info
        )
      );
    }

    return defer;
  };
}

function wrapFieldsWithMiddleware(fields) {
  for (const label in fields) {
    const field = fields[label];

    if (!!field && typeof field == "object" && !field.applyed) {
      field.resolve = resolverMiddlewareWrapper(
        field.resolve,
        field.astNode.directives
      );

      const complexityDirective = field.astNode.directives.find(
        x => x.name.value === "complexity"
      );

      if (complexityDirective) {
        const keyValues = complexityDirective.arguments.reduce((s, n) => {
          s[n.name.value] = n.value.value;
          return s;
        }, {});

        field.complexity = (args, childComplexity) => {
          if (keyValues.multiplier && args[keyValues.multiplier])
            return childComplexity * args[keyValues.multiplier];
          return keyValues.cost || childComplexity || 1;
        };
      }

      field.applyed = true;
      if (field.type._fields) wrapFieldsWithMiddleware(field.type._fields);
      if (field.type.ofType && field.type.ofType._fields)
        wrapFieldsWithMiddleware(field.type.ofType._fields);
    }
  }
}

function GraphQLCustomDirective(config) {
  const directive = new GraphQLDirective(config);

  if (config.resolve) directive.resolve = config.resolve;
  return directive;
}

function addCustomDirectivesToSchema(schema, customDirectives = []) {
  if (!(schema instanceof GraphQLSchema))
    throw new Error("Schema must be instanceof GraphQLSchema");

  const customDirectiveDefs = Object.keys(customDirectives).map(directive => {
    const customDirectiveDef = customDirectives[directive];
    customDirectiveDef.name = directive;
    const customDirective = GraphQLCustomDirective(customDirectiveDef);
    return customDirective;
  });

  schema._directives = schema._directives.concat(customDirectiveDefs || []);
  schema._queryType && wrapFieldsWithMiddleware(schema._queryType._fields);
  schema._mutationType &&
    wrapFieldsWithMiddleware(schema._mutationType._fields);
  return true;
}

module.exports = {
  addCustomDirectivesToSchema
};
