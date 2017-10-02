# Getting Started

* [Installation](#installation)
* [CLI](#cli)
* [Setup a GraphQL-Server](#setup-a-graphql-server)
* [Programmers Guide](#programmers-guide)

## Installation

SubKit GraphQL-Server is super easy to set up. Just `npm install -g subkit`, write a GraphQL schema, and then use one of the following snippets to get started. For more info, read the SubKit GraphQL-Server docs.

```bash
npm install -g subkit
```

## CLI

```bash
subkit help
```

```bash
Usage: subkit [options] [command]


Options:

  -V, --version  output the version number
  -h, --help     output usage information


Commands:

  create|new <folder>  Creates a GraphQL-API application.
  serve                Serves a GraphQL-API application.
  request|req          Executes GraphQL requests.
  jwt                  Decodes/Encodes JSON Web Tokens.
  help [cmd]           display help for [cmd]
```

## Setup a GraphQL-Server

```bash
subkit create mygraphql
cd mygraphql

npm test #Test environment
npm run dev #Development environment
npm start #Production environment
```

## Programmers Guide

> coming soon