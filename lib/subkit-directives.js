const {GraphQLString, GraphQLInt, GraphQLNonNull} = require('graphql');
const {DirectiveLocation} = require('graphql/type/directives');
const GraphQLJSON = require('graphql-type-json');
const jsonQuery = require('json-query');
const format = require('es6-template-strings');
const path = require('path');
const exec = require('child_process').exec;

const mock = {
  description: 'Mock resolver results via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    value: {type: new GraphQLNonNull(GraphQLJSON)},
    demo: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) => {
    if (parent && parent[info.fieldName]) parent[info.fieldName] = args.value;
    return resolve().then(() => args.value);
  }
};

const getJSON = {
  description: 'Fetch URL result value e.g. @fetchJSON(url: "https://...").',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt},
    jwt: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }

      return fetch(
        format(args.url, Object.assign({}, parent, args, ctx, data)),
        {
          timeout: parseInt(args.timeout) || 0,
          headers
        }
      )
        .then(response => {
          if (response.status >= 400) throw new Error(response.statusText);
          return response;
        })
        .then(result => result.json())
        .then(
          data =>
            args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
        );
    })
};

const postJSON = {
  description: 'Fetch URL result value e.g. @postJSON(url: "https://...").',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt},
    jwt: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }

      return fetch(
        format(args.url, Object.assign({}, parent, args, ctx, data)),
        {
          method: 'POST',
          body: JSON.stringify(data || args.input),
          timeout: parseInt(args.timeout) || 0,
          headers
        }
      )
        .then(response => {
          if (response.status >= 400) throw new Error(response.statusText);
          return response;
        })
        .then(result => result.json())
        .then(
          data =>
            args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
        );
    })
};

const putJSON = {
  description: 'Fetch URL result value e.g. @postJSON(url: "https://...").',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt},
    jwt: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }

      return fetch(
        format(args.url, Object.assign({}, parent, args, ctx, data)),
        {
          method: 'PUT',
          body: JSON.stringify(data || args.input),
          timeout: parseInt(args.timeout) || 0,
          headers
        }
      )
        .then(response => {
          if (response.status >= 400) throw new Error(response.statusText);
          return response;
        })
        .then(result => result.json())
        .then(
          data =>
            args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
        );
    })
};

const patchJSON = {
  description: 'Fetch URL result value e.g. @postJSON(url: "https://...").',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt},
    jwt: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }

      return fetch(
        format(args.url, Object.assign({}, parent, args, ctx, data)),
        {
          method: 'PATCH',
          body: JSON.stringify(data || args.input),
          timeout: parseInt(args.timeout) || 0,
          headers
        }
      )
        .then(response => {
          if (response.status >= 400) throw new Error(response.statusText);
          return response;
        })
        .then(result => result.json())
        .then(
          data =>
            args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
        );
    })
};

const deleteJSON = {
  description: 'Fetch URL result value e.g. @postJSON(url: "https://...").',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt},
    jwt: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }

      return fetch(
        format(args.url, Object.assign({}, parent, args, ctx, data)),
        {
          method: 'DELETE',
          body: JSON.stringify(data || args.input),
          timeout: parseInt(args.timeout) || 0,
          headers
        }
      )
        .then(response => {
          if (response.status >= 400) throw new Error(response.statusText);
          return response;
        })
        .then(result => result.json())
        .then(
          data =>
            args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
        );
    })
};

const publish = {
  description: 'Publish an event to subscription by channel name.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    channelName: {type: new GraphQLNonNull(GraphQLString)},
    payload: {type: GraphQLJSON}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(result => {
      ctx.pubsub.publish(args.channelName, args.payload || result);
      return result;
    })
};

const complexity = {
  description: 'Add complexity analysis modifiers to field definition.',
  locations: [DirectiveLocation.FIELD_DEFINITION],
  args: {
    cost: {type: new GraphQLNonNull(GraphQLInt)},
    multiplier: {type: new GraphQLNonNull(GraphQLString)}
  }
};

const execute = {
  description: 'Execute a local script to resolve a field.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    cmd: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString},
    timeout: {type: GraphQLInt}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(result => {
      return new Promise((resolve, reject) => {
        exec(
          args.cmd,
          {
            timeout: args.timeout || 0,
            shell: '/bin/bash',
            cwd: process.cwd()
          },
          (err, stdout, stderr) => {
            if (err) return reject(err);
            if (stderr) return reject(stderr);

            let data = null;
            try {
              data = JSON.parse(stdout);
            } catch (error) {
              reject(error);
            }

            resolve(
              args.jsonQuery ? jsonQuery(args.jsonQuery, {data}).value : data
            );
          }
        );
      });
    })
};

const contextify = {
  description:
    'Temporary store field data in context and use it later in the execution process.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {},
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(result => {
      return new Promise((resolve, reject) => {
        ctx[info.fieldName] = result;
        resolve(result);
      });
    })
};

module.exports = {
  mock,
  fetchJSON: getJSON,
  getJSON,
  postJSON,
  putJSON,
  patchJSON,
  deleteJSON,
  publish,
  execute,
  complexity,
  contextify
};
