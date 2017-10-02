# SubKit GraphQL-Server Documentation

## Principles

SubKit GraphQL-Server is built with the following principles in mind:

* **Simplicity** by keeping things simple, SubKit GraphQL-Server is easier to use, easier to contribute to, and more secure
* **Performance** SubKit GraphQL-Server is well-tested and production-ready - no modifications needed
* **Experience** Front-end / Contract-Driven approach - designed and developed to make front-end and back-end development as efficient as possible.
* **Build-In** All important tools to create and manage GraphQL-APIs are available via CLI.

Anyone is welcome to contribute to SubKit GraphQL-Server, just read [CONTRIBUTING](../CONTRIBUTING.md) and take a look at the [READMAP](ROADMAP.md).

* [Guide to Getting Started](getting-started.md)
  * [Installation](getting-started.md#installation)
  * [CLI](getting-started.md#cli)
  * [Setup a GraphQL-Server](getting-started.md#setup-a-graphql-server)
  * [Programmers Guide](getting-started.md#programmers-guide)
* [Queries](queries.md)
  * [Create GraphQL-Schema via GQL](queries.md#create-graphql-schema-via-gql)
  * [GraphQL Types](queries.md#graphql-types)
  * [Implement query resolver functions](queries.md#implement-query-resolver-functions)
  * [Usage of resolver function context](queries.md#usage-of-resolver-function-context)
  * [Usage of GraphQL query variables](queries.md#usage-of-graphql-query-variables)
* [Advanced queries](advanced-queries.md)
  * [Relational data queries](advanced-queries.md#relational-data-queries)
    * [Expand the GraphQL-Schema](advanced-queries.md#expand-the-graphql-schema)
    * [Implement the resolver functions](advanced-queries.md#implement-the-resolver-function)
    * [Execute a GraphQL query](advanced-queries.md#execute-a-graphql-query)
* [Clients](clients.md)
  * [cURL](clients.md#curl)
  * [HTTP-Fetch](clients.md#http-fetch)
  * [SubKit request](clients.md#subkit-request)
* [Mutations](mutations.md)
  * [Expand the GraphQL-Schema](mutations.md#expand-the-graphql-schema)
  * [Implement the resolver functions](mutations.md#implement-the-resolver-function)
  * [Execute a GraphQL mutation query](mutations.md#execute-a-graphql-mutation-query)
  * [Usage of GraphQL mutation variables](mutations.md#usage-of-graphql-mutation-variables)
* [Subscriptions](subscriptions.md)
  * [Setup and Subscribe to GraphQL-Subscriptions](subscriptions.md#graphql-subscriptions)
  * [Use Publish/Subscribe programmatically](subscriptions.md#use-publish/subscribe-programmatically)
* [Directives](directives.md)
  * [Build-In](directives.md#subkit-build-in)
  * [Programming Custom-Directives](directives.md#programming-custom-directives)
* [JSON Web Token (JWT) Authentication](jwt-auth.md)
  * [Encode a JSON Web Token](jwt-auth.md#encode-a-json-web-token)
  * [Verify and decode a JSON Web Token](jwt-auth.md#verify-and-decode-a-json-web-token)
  * [Request GraphQL-API using JSON Web Token](jwt-auth.md#request-graphql-api-using-json-web-token)
  * [Usage of JWT authentication for authorization](jwt-auth.md#usage-of-jwt-authentication-for-authorization)
* [More examples](https://github.com/codecommission/subkit-examples)
* Error Handling (coming soon)
  * Domain errors
  * Infrastructure errors
* Instrumentation and Logging (coming soon)
* Testing (coming soon)
* Batching and Caching (coming soon)
* Include SubKit GraphQL-Server as a Module (coming soon)