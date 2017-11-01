# Roadmap + Designs

This document contains a rough outline of a roadmap and a few designs for future features in SubKit GraphQL-Server. Contributions are very welcome! Feel free to pick an of the upcoming features and start implementing, and don't hold back with questions or ideas!

## Roadmap

### Completed

* GraphQL subscriptions via Server-Side-Events (SSE-Transport)
* Build-In and custom directives
  * @fetchJSON, @publish, @mock, @execute, @complexity, @cacheControl
* GraphQL request CLI with subscription support
* Simplification of API
* Persistent query support
* Collect traces from query resolvers

### Current

* Performance testing in production settings
* Resolver batching and caching
* Enhance documentation and tests
* more build-in and custom directives
  * @requestJSON
* Usage metric calculation
* Web-Hook endpoint to publish events via HTTP
* Integration guide to:
  * API-Gateway for Micro/Macro-Services and Datebases
  * AWS Lambda
  * Azure Functions
* Deployment guide to:
  * [DropStack](https://dropstack.run)
  * AWS Lambda

### Next up

* Better GraphQL error handling
* Support for simple query timeouts
* GraphQL query batching
* NPM modularization of:
  * SubKit GraphQL middleware
  * SubKit directives
  * SubKit CLI

### Future

* Support for @defer, @stream and @live directives

## Proposed designs

### Support for @defer, @live and @stream

Support for the defer, stream and live directives will require replacing or modifying graphql-js’ `execute` function. The `execute` function would have to be changed to return an observable instead of a promise, and support for each of the directives would have to be built directly into the execution engine.
In addition, a new protocol will need to be devised for sending partial results back to the clients. The most straightforward way seems to be to include a path with the data sent in the response, for example `{ path: [ 'author', 'posts', 0 ], data: { title: 'Hello', views: 10 } }`. Such a response could then be merged on the client.

@defer could be implemented with a queue. Whenever a “defer” is encountered, it is put on the deferred queue. Once the initial response is sent, the deferred queue is processed. As each item in that queue is processed a new chunk is sent back.

Similar to defer, @live requires changes to the execution engine. In particular, it needs to know to set up a task that keeps sending updates. This can again be done by returning an observable, and then sending the data over a websocket or similar persistent transport. In its most basic form, @live could be implemented by re-running the live subtree of the query at a periodic interval. More advanced implementations will depend on setting up event listeners and re-executing parts of the query only when relevant results have changed.

@stream is similar to @defer, except that processing can continue right away, and the streamed part of the result can begin sending right away.