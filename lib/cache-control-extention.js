import { getNamedType, GraphQLObjectType, responsePathAsArray } from "graphql";

export class CacheControlExtension {
  constructor() {
    this.hints = new Map();
  }

  willResolveField(_source, _args, _context, info) {
    let hint = {};

    const targetType = getNamedType(info.returnType);
    if (targetType instanceof GraphQLObjectType) {
      if (targetType.astNode) {
        hint = mergeHints(
          hint,
          cacheHintFromDirectives(targetType.astNode.directives)
        );
      }
    }

    const parentType = info.parentType;
    if (parentType instanceof GraphQLObjectType) {
      const fieldDef = parentType.getFields()[info.fieldName];
      if (fieldDef.astNode) {
        hint = mergeHints(
          hint,
          cacheHintFromDirectives(fieldDef.astNode.directives)
        );
      }
    }

    if (targetType instanceof GraphQLObjectType && hint.maxAge === undefined) {
      hint.maxAge = 0;
    }

    if (hint.maxAge !== undefined || hint.scope !== undefined) {
      this.addHint(info.path, hint);
    }
    info.cacheControl = {
      maxAge: hint.maxAge,
      scope: hint.scope,
      setCacheHint: hint => {
        this.addHint(info.path, hint);
      }
    };
  }

  addHint(path, hint) {
    const existingCacheHint = this.hints.get(path);
    if (existingCacheHint) {
      this.hints.set(path, mergeHints(existingCacheHint, hint));
    } else {
      this.hints.set(path, hint);
    }
  }

  format() {
    return [
      "cacheControl",
      {
        version: 1,
        hints: Array.from(this.hints).map(([path, hint]) =>
          Object.assign(
            {
              path: responsePathAsArray(path)
            },
            hint
          )
        )
      }
    ];
  }
}

function cacheHintFromDirectives(directives) {
  if (!directives) return undefined;

  const cacheControlDirective = directives.find(
    directive => directive.name.value === "cacheControl"
  );
  if (!cacheControlDirective) return undefined;

  if (!cacheControlDirective.arguments) return undefined;

  const maxAgeArgument = cacheControlDirective.arguments.find(
    argument => argument.name.value === "maxAge"
  );
  const scopeArgument = cacheControlDirective.arguments.find(
    argument => argument.name.value === "scope"
  );

  return {
    maxAge:
      maxAgeArgument &&
      maxAgeArgument.value &&
      maxAgeArgument.value.kind === "IntValue"
        ? parseInt(maxAgeArgument.value.value)
        : undefined,
    scope:
      scopeArgument &&
      scopeArgument.value &&
      scopeArgument.value.kind === "EnumValue"
        ? scopeArgument.value.value
        : undefined
  };
}

function mergeHints(hint, otherHint) {
  if (!otherHint) return hint;
  let result = {};
  if (otherHint.maxAge || hint.maxAge)
    result.maxAge = otherHint.maxAge || hint.maxAge;
  if (otherHint.scope || hint.scope)
    result.scope = otherHint.scope || hint.scope;
  return result;
}
