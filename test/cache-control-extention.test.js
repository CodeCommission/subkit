import { deepEqual } from "assert";

import { GraphQLSchema, graphql } from "graphql";

import {
  enableGraphQLExtensions,
  GraphQLExtensionStack
} from "../lib/extentions";
import { CacheControlExtension } from "../lib/cache-control-extention";

export async function collectCacheControlHints(schema, source) {
  enableGraphQLExtensions(schema);

  const cacheControlExtension = new CacheControlExtension();

  const response = await graphql({
    schema,
    source,
    contextValue: {
      _extensionStack: new GraphQLExtensionStack([cacheControlExtension])
    }
  });

  deepEqual(response.errors, undefined);

  return cacheControlExtension.format()[1].hints;
}

import { buildSchema } from "graphql";

describe("@cacheControl directives", () => {
  it("should set maxAge: 0 and no scope for a field without cache hints", async () => {
    const schema = buildSchema(`
    type Query {
      droid(id: ID!): Droid
    }

    type Droid {
      id: ID!
      name: String!
    }
  `);

    const hints = await collectCacheControlHints(
      schema,
      `
      query {
        droid(id: 2001) {
          name
        }
      }
    `
    );

    deepEqual(hints, [{ path: ["droid"], maxAge: 0 }]);
  });
  it("should set the specified maxAge from a cache hint on the field", async () => {
    const schema = buildSchema(`
      type Query {
        droid(id: ID!): Droid @cacheControl(maxAge: 60)
      }

      type Droid {
        id: ID!
        name: String!
      }
    `);

    const hints = await collectCacheControlHints(
      schema,
      `
        query {
          droid(id: 2001) {
            name
          }
        }
      `
    );

    deepEqual(hints, [{ path: ["droid"], maxAge: 60 }]);
  });

  it("should set the specified maxAge for a field from a cache hint on the target type", async () => {
    const schema = buildSchema(`
      type Query {
        droid(id: ID!): Droid
      }

      type Droid @cacheControl(maxAge: 60) {
        id: ID!
        name: String!
      }
    `);

    const hints = await collectCacheControlHints(
      schema,
      `
        query {
          droid(id: 2001) {
            name
          }
        }
      `
    );

    deepEqual(hints[0], { path: ["droid"], maxAge: 60 });
  });
});
