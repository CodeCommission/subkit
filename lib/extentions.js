import {
  GraphQLSchema,
  GraphQLObjectType,
  getNamedType,
  GraphQLField,
  defaultFieldResolver,
  GraphQLResolveInfo
} from "graphql";

export class GraphQLExtension {
  requestDidStart() {}

  parsingDidStart() {}
  parsingDidEnd() {}

  validationDidStart() {}
  validationDidEnd() {}

  willResolveField(source, args, context, info) {}

  executionDidStart() {}
  executionDidEnd() {}

  requestDidEnd() {}

  format() {}
}

export class GraphQLExtensionStack {
  constructor(extensions) {
    this.extensions = [];
    this.extensions = extensions.map(extension => {
      return typeof extension === "function" ? new extension() : extension;
    });
  }

  requestDidStart() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  parsingDidStart() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  parsingDidEnd() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  validationDidStart() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  validationDidEnd() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  willResolveField(source, args, context, info) {
    const handlers = this.extensions
      .map(
        extension =>
          extension.willResolveField &&
          extension.willResolveField(source, args, context, info)
      )
      .filter(x => x);

    return result => {
      for (const handler of handlers) {
        handler(result);
      }
    };
  }

  executionDidStart() {
    for (const extension of this.extensions) {
      if (extension.requestDidStart) {
        extension.requestDidStart();
      }
    }
  }

  executionDidEnd() {
    for (const extension of this.extensions) {
      if (extension.executionDidEnd) {
        extension.executionDidEnd();
      }
    }
  }

  requestDidEnd() {
    for (const extension of this.extensions) {
      if (extension.requestDidEnd) {
        extension.requestDidEnd();
      }
    }
  }

  format() {
    return this.extensions
      .map(extension => extension.format && extension.format())
      .filter(x => x)
      .reduce(
        (extensions, [key, value]) =>
          Object.assign(extensions, { [key]: value }),
        {}
      );
  }
}

export function enableGraphQLExtensions(schema) {
  if (schema._extensionsEnabled) return schema;

  schema._extensionsEnabled = true;

  forEachField(schema, wrapField);

  return schema;
}

function wrapField(field) {
  const fieldResolver = field.resolve;

  field.resolve = (source, args, context, info) => {
    const extensionStack = context && context._extensionStack;
    const handler =
      extensionStack &&
      extensionStack.willResolveField(source, args, context, info);

    try {
      const result = (fieldResolver || defaultFieldResolver)(
        source,
        args,
        context,
        info
      );
      whenResultIsFinished(result, () => {
        handler && handler(result);
      });
      return result;
    } catch (error) {
      handler && handler();
      throw error;
    }
  };
}

function whenResultIsFinished(result, callback) {
  if (result === null || typeof result === "undefined") {
    callback();
  } else if (typeof result.then === "function") {
    result.then(callback, callback);
  } else if (Array.isArray(result)) {
    const promises = [];
    result.forEach(value => {
      if (value && typeof value.then === "function") {
        promises.push(value);
      }
      if (promises.length > 0) {
        Promise.all(promises).then(callback, callback);
      } else {
        callback();
      }
    });
  } else {
    callback();
  }
}

function forEachField(schema, fn) {
  const typeMap = schema.getTypeMap();
  Object.keys(typeMap).forEach(typeName => {
    const type = typeMap[typeName];

    if (
      !getNamedType(type).name.startsWith("__") &&
      type instanceof GraphQLObjectType
    ) {
      const fields = type.getFields();
      Object.keys(fields).forEach(fieldName => {
        const field = fields[fieldName];
        fn(field, typeName, fieldName);
      });
    }
  });
}
