# SubKit - Getting started

* Queries
  * Schema via IDL
  * Resolvers
* Mutations
* Subscriptions
* Custom Directives
* Authentication via JSON Web Token
* Include as Module

```graphql
query all {
  items @resolverTimeLog {
    value @mock(value: "mike") @toUpperCase
    foo
    demos @mock(value: [{val: "Ass2s"}]) {
      val
    }
    hello @resolverTimeLog @fetch(timeout: 10000, url: "https://dropstack-mapping-example.services.dropstack.run/hellos")
    hello @mock(value: ["a", "1"])
  }
}
```