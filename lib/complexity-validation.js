import {
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  Kind,
  getNamedType,
  GraphQLError
} from "graphql";
import { getArgumentValues } from "graphql/execution/values";
import assert from "assert";

export class QueryComplexity {
  constructor(context, options) {
    assert(
      typeof options.maximumComplexity === "number" &&
        options.maximumComplexity > 0,
      "Maximum query complexity must be a positive number"
    );

    this.context = context;
    this.complexity = 0;
    this.options = options;
    this.fragments = this.getFragments(context);

    this.OperationDefinition = {
      enter: this.onOperationDefinitionEnter,
      leave: this.onOperationDefinitionLeave
    };
  }

  getFragments(context) {
    return context.getDocument().definitions.reduce((map, definition) => {
      if (definition.kind === Kind.FRAGMENT_DEFINITION) {
        map[definition.name.value] = definition;
      }

      return map;
    }, {});
  }

  onOperationDefinitionEnter(operation) {
    switch (operation.operation) {
      case "query":
        this.complexity += this.nodeComplexity(
          operation,
          this.context.getSchema().getQueryType()
        );
        break;
      case "mutation":
        this.complexity += this.nodeComplexity(
          operation,
          this.context.getSchema().getMutationType()
        );
        break;
      case "subscription":
        this.complexity += this.nodeComplexity(
          operation,
          this.context.getSchema().getSubscriptionType()
        );
        break;
      default:
        throw new Error(
          `Query complexity could not be calculated for operation of type ${operation.operation}`
        );
    }
  }

  onOperationDefinitionLeave() {
    if (this.options.onComplete) {
      this.options.onComplete(this.complexity);
    }

    if (this.complexity > this.options.maximumComplexity) {
      return this.context.reportError(this.createError());
    }
  }

  nodeComplexity(node, typeDef, complexity = 0) {
    if (node.selectionSet) {
      let fields = {};
      if (
        typeDef instanceof GraphQLObjectType ||
        typeDef instanceof GraphQLInterfaceType
      ) {
        fields = typeDef.getFields();
      }

      return (
        complexity +
        node.selectionSet.selections.reduce((total, childNode) => {
          let nodeComplexity = 0;

          switch (childNode.kind) {
            case Kind.FIELD: {
              const field = fields[childNode.name.value];
              // Invalid field, should be caught by other validation rules
              if (!field) {
                break;
              }
              const fieldType = getNamedType(field.type);

              // Get arguments
              const args = getArgumentValues(
                field,
                childNode,
                this.options.variables || {}
              );

              // Check if we have child complexity
              let childComplexity = 0;
              if (
                fieldType instanceof GraphQLObjectType ||
                fieldType instanceof GraphQLInterfaceType ||
                fieldType instanceof GraphQLUnionType
              ) {
                childComplexity = this.nodeComplexity(childNode, fieldType);
              }

              // Calculate complexity score
              switch (typeof field.complexity) {
                case "function":
                  nodeComplexity = field.complexity(args, childComplexity);
                  break;
                case "number":
                  nodeComplexity = childComplexity + field.complexity;
                  break;
                default:
                  nodeComplexity = this.getDefaultComplexity(
                    args,
                    childComplexity
                  );
                  break;
              }
              break;
            }
            case Kind.FRAGMENT_SPREAD: {
              const fragment = this.fragments[childNode.name.value];
              const fragmentType = this.context
                .getSchema()
                .getType(fragment.typeCondition.name.value);
              nodeComplexity = this.nodeComplexity(fragment, fragmentType);
              break;
            }
            case Kind.INLINE_FRAGMENT: {
              let inlineFragmentType = typeDef;
              if (childNode.typeCondition && childNode.typeCondition.name) {
                inlineFragmentType = this.context
                  .getSchema()
                  .getType(childNode.typeCondition.name.value);
              }

              nodeComplexity = this.nodeComplexity(
                childNode,
                inlineFragmentType
              );
              break;
            }
            default: {
              nodeComplexity = this.nodeComplexity(childNode, typeDef);
              break;
            }
          }

          childNode.score = Math.max(nodeComplexity, 0);
          return Math.max(nodeComplexity, 0) + total;
        }, complexity)
      );
    }

    return complexity;
  }

  createError() {
    if (typeof this.options.createError === "function") {
      return this.options.createError(
        this.options.maximumComplexity,
        this.complexity
      );
    }
    return new GraphQLError(
      queryComplexityMessage(this.options.maximumComplexity, this.complexity)
    );
  }

  getDefaultComplexity(args, childScore) {
    return 1 + childScore;
  }
}

export function createQueryComplexityValidator(options) {
  return context => new QueryComplexity(context, options);
}

function queryComplexityMessage(max, actual) {
  return (
    `The query exceeds the maximum complexity of ${max}. ` +
    `Actual complexity is ${actual}`
  );
}
