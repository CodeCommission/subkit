# SubKit - Getting started

* [Setup](#setup)
  * Installation
  * CLI
* [Queries](queries.md)
  * Schema via IDL
  * Build-In Types
  * Query resolver functions
  * Resolver context
  * Usage of Query Variables
* [Advanced queries](advanced-queries.md)
* [Clients](clients.md)
* [Mutations](mutations.md)
* [Subscriptions](subscriptions.md)
* [Directives](directives.md)
  * Build-In
  * Custom
* [JSON Web Token (JWT) Authentication](jwt-auth.md)
* Error Handling (TBD)
  * Domain errors
  * Infrastructure errors
* Instrumentation and Logging (TBD)
* Testing (TBD)
* Batching and Caching (TBD)
* Include as Module (TBD)

## Setup

### Principles

SubKit GraphQL-Server is built with the following principles in mind:

* By the community, for the community: SubKit GraphQL-Server's development is driven by the needs of developers
* Simplicity: by keeping things simple, SubKit GraphQL-Server is easier to use, easier to contribute to, and more secure
* Performance: SubKit GraphQL-Server is well-tested and production-ready - no modifications needed
* Experience: Front-end / Contract-Driven approach - designed and developed to make front-end and back-end development as efficient as possible.

Anyone is welcome to contribute to SubKit GraphQL-Server, just read [CONTRIBUTING.md](../CONTRIBUTING.md), take a look at the [roadmap](ROADMAP.md) and make your first PR!

### Installation

SubKit GraphQL-Server is super easy to set up. Just `npm install -g subkit`, write a GraphQL schema, and then use one of the following snippets to get started. For more info, read the SubKit GraphQL-Server docs.

```bash
npm install -g subkit
```

### CLI

```bash
subkit help
```

```bash
Usage: subkit [options] [command]


Options:

  -V, --version  output the version number
  -h, --help     output usage information


Commands:

  create <folder>  Creates a Subkit application.
  serve            Serves a Subkit application.
  help [cmd]       display help for [cmd]
```

### Setup a new GraphQL-Server Project

```bash
subkit create mygraphql
cd mygraphql

npm test #Test environment
npm run dev #Development environment
npm start #Production environment
```