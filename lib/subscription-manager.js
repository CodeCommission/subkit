import {
  GraphQLSchema,
  GraphQLError,
  validate,
  execute,
  parse,
  specifiedRules,
  OperationDefinitionNode,
  ValidationContext,
  SelectionNode,
  FieldNode
} from "graphql";
import { getArgumentValues } from "graphql/execution/values";

const FIELD = "Field";

export class ValidationError extends Error {
  constructor(errors) {
    super();
    this.errors = errors;
    this.message = "Subscription query has validation errors";
  }
}

export class SubscriptionManager {
  constructor(options) {
    this.pubsub = options.pubsub;
    this.schema = options.schema;
    this.setupFunctions = options.setupFunctions || {};
    this.subscriptions = {};
    this.maxSubscriptionId = 0;
  }

  publish(triggerName, payload) {
    this.pubsub.publish(triggerName, payload);
  }

  subscribe(options) {
    // 1. validate the query, operationName and variables
    const parsedQuery = parse(options.query);
    const errors = validate(this.schema, parsedQuery, [
      ...specifiedRules,
      subscriptionHasSingleRootField
    ]);

    // TODO: validate that all variables have been passed (and are of correct type)?
    if (errors.length) {
      // this error kills the subscription, so we throw it.
      return Promise.reject(new ValidationError(errors));
    }

    let args = {};

    // operationName is the name of the only root field in the subscription document
    let subscriptionName = "";
    parsedQuery.definitions.forEach(definition => {
      if (definition.kind === "OperationDefinition") {
        // only one root field is allowed on subscription. No fragments for now.
        const rootField = definition.selectionSet.selections[0];
        subscriptionName = rootField.name.value;

        const fields = this.schema.getSubscriptionType().getFields();
        args = getArgumentValues(
          fields[subscriptionName],
          rootField,
          options.variables
        );
      }
    });

    let triggerMap;

    if (this.setupFunctions[subscriptionName]) {
      triggerMap = this.setupFunctions[subscriptionName](
        options,
        args,
        subscriptionName
      );
    } else {
      // if not provided, the triggerName will be the subscriptionName, The trigger will not have any
      // options and rely on defaults that are set later.
      triggerMap = { [subscriptionName]: {} };
    }

    const externalSubscriptionId = this.maxSubscriptionId++;
    this.subscriptions[externalSubscriptionId] = [];
    const subscriptionPromises = [];
    Object.keys(triggerMap).forEach(triggerName => {
      // Deconstruct the trigger options and set any defaults
      const {
        channelOptions = {},
        filter = () => true // Let all messages through by default.
      } = triggerMap[triggerName];

      // 2. generate the handler function
      //
      // rootValue is the payload sent by the event emitter / trigger by
      // convention this is the value returned from the mutation
      // resolver
      const onMessage = rootValue => {
        return Promise.resolve()
          .then(() => {
            if (typeof options.context === "function") {
              return options.context();
            }
            return options.context;
          })
          .then(context => {
            return Promise.all([context, filter(rootValue, context)]);
          })
          .then(([context, doExecute]) => {
            if (!doExecute) {
              return;
            }
            execute(
              this.schema,
              parsedQuery,
              rootValue,
              context,
              options.variables,
              options.operationName
            ).then(data => options.callback(null, data));
          })
          .catch(error => {
            options.callback(error);
          });
      };

      // 3. subscribe and keep the subscription id
      subscriptionPromises.push(
        this.pubsub
          .subscribe(triggerName, onMessage, channelOptions)
          .then(id => this.subscriptions[externalSubscriptionId].push(id))
      );
    });

    // Resolve the promise with external sub id only after all subscriptions completed
    return Promise.all(subscriptionPromises).then(() => externalSubscriptionId);
  }

  unsubscribe(subId) {
    // pass the subId right through to pubsub. Do nothing else.
    this.subscriptions[subId].forEach(internalId => {
      this.pubsub.unsubscribe(internalId);
    });
    delete this.subscriptions[subId];
  }
}

function tooManySubscriptionFieldsError(subscriptionName) {
  return `Subscription "${subscriptionName}" must have only one field.`;
}

function subscriptionHasSingleRootField(context) {
  const schema = context.getSchema();
  schema.getSubscriptionType();
  return {
    OperationDefinition(node) {
      const operationName = node.name ? node.name.value : "";
      let numFields = 0;
      node.selectionSet.selections.forEach(selection => {
        if (selection.kind === FIELD) {
          numFields++;
        } else {
          // why the heck use a fragment on the Subscription type? Just ... don't
          context.reportError(
            new GraphQLError(
              "Apollo subscriptions do not support fragments on the root field",
              [node]
            )
          );
        }
      });
      if (numFields > 1) {
        context.reportError(
          new GraphQLError(tooManySubscriptionFieldsError(operationName), [
            node
          ])
        );
      }
      return false;
    }
  };
}
