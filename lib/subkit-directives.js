const {
  GraphQLString,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLList
} = require('graphql');
const {DirectiveLocation} = require('graphql/type/directives');
const GraphQLJSON = require('graphql-type-json');
const jsonQuery = require('json-query');
const format = require('es6-template-strings');
const path = require('path');
const childProcess = require('child_process');
const EventSource = require('eventsource');
const uuid = require('uuid');
const LRU = require('lru-cache')({max: 1000});
const hash = require('object-hash');
const DataLoader = require('dataloader');

const constant = {
  description: 'Return a constant value.',
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
  description: 'HTTP GET from URL via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) => {
    return resolve().then(data => {
      const cacheKey = hash(
        Object.assign({scope: info.cacheControl.scope}, args, info.path)
      );
      const cachedValue = LRU.get(cacheKey);
      if (cachedValue) return resolve().then(() => cachedValue);

      const headers = Object.assign({}, ctx.headers, args.headers, {
        'content-type': 'application/json'
      });
      delete headers['host'];
      delete headers['pragma'];
      delete headers['connection'];
      delete headers['content-length'];
      delete headers['cache-control'];
      delete headers['origin'];
      delete headers['dnt'];
      delete headers['accept'];

      return fetch(
        format(args.url, Object.assign({}, {parent, args, context: ctx, data})),
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
            args.jsonQuery
              ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
              : data
        )
        .then(data => {
          if (info.cacheControl.maxAge)
            LRU.set(cacheKey, data, parseInt(info.cacheControl.maxAge));
          return data;
        })
        .catch(error => {
          if (args.catch) return null;
          throw error;
        });
    });
  }
};

const getJSONBatched = {
  description: 'HTTP GET from URL via JSON batched.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    ids: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) => {
    if (!ctx[`fetch-batched-${info.fieldName}`]) {
      ctx[`fetch-batched-${info.fieldName}`] = new DataLoader(ids => {
        const cacheKey = hash(
          Object.assign({scope: info.cacheControl.scope}, args, ids)
        );
        const cachedValue = LRU.get(cacheKey);
        if (cachedValue) return resolve().then(() => cachedValue);

        return resolve().then(data => {
          const cacheKey = hash(
            Object.assign({scope: info.cacheControl.scope}, args, info.path)
          );
          const cachedValue = LRU.get(cacheKey);
          if (cachedValue) return resolve().then(() => cachedValue);

          const headers = Object.assign({}, ctx.headers, args.headers, {
            'content-type': 'application/json'
          });
          delete headers['host'];
          delete headers['pragma'];
          delete headers['connection'];
          delete headers['content-length'];
          delete headers['cache-control'];
          delete headers['origin'];
          delete headers['dnt'];
          delete headers['accept'];
          return fetch(
            format(
              args.url,
              Object.assign({}, {parent, args, context: ctx, data, ids})
            ),
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
                args.jsonQuery
                  ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
                  : data
            )
            .then(data => {
              if (info.cacheControl.maxAge)
                LRU.set(cacheKey, data, parseInt(info.cacheControl.maxAge));
              return data;
            })
            .catch(error => {
              if (args.catch) return null;
              throw error;
            });
        });
      });
    }
    return resolve().then(() =>
      ctx[`fetch-batched-${info.fieldName}`].load(parent[args.ids])
    );
  }
};

const postJSON = {
  description: 'HTTP POST input field value to URL via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = Object.assign({}, ctx.headers, args.headers, {
        'content-type': 'application/json'
      });
      delete headers['host'];
      delete headers['pragma'];
      delete headers['connection'];
      delete headers['content-length'];
      delete headers['cache-control'];
      delete headers['origin'];
      delete headers['dnt'];
      delete headers['accept'];

      return fetch(
        format(args.url, Object.assign({}, {parent, args, context: ctx, data})),
        {
          method: 'POST',
          body: JSON.stringify(
            (data && data.input) || (args && args.input) || data || args.input
          ),
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
            args.jsonQuery
              ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
              : data
        )
        .catch(error => {
          if (args.catch) return null;
          throw error;
        });
    })
};

const putJSON = {
  description: 'HTTP PUT input field value to URL via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = Object.assign({}, ctx.headers, args.headers, {
        'content-type': 'application/json'
      });
      delete headers['host'];
      delete headers['pragma'];
      delete headers['connection'];
      delete headers['content-length'];
      delete headers['cache-control'];
      delete headers['origin'];
      delete headers['dnt'];
      delete headers['accept'];

      return fetch(
        format(args.url, Object.assign({}, {parent, args, context: ctx, data})),
        {
          method: 'PUT',
          body: JSON.stringify(
            (data && data.input) || (args && args.input) || data || args.input
          ),
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
            args.jsonQuery
              ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
              : data
        );
    })
};

const patchJSON = {
  description: 'HTTP PATCH input field value to URL via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = Object.assign({}, ctx.headers, args.headers, {
        'content-type': 'application/json'
      });
      delete headers['host'];
      delete headers['pragma'];
      delete headers['connection'];
      delete headers['content-length'];
      delete headers['cache-control'];
      delete headers['origin'];
      delete headers['dnt'];
      delete headers['accept'];

      return fetch(
        format(args.url, Object.assign({}, {parent, args, context: ctx, data})),
        {
          method: 'PATCH',
          body: JSON.stringify(
            (data && data.input) || (args && args.input) || data || args.input
          ),
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
            args.jsonQuery
              ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
              : data
        )
        .catch(error => {
          if (args.catch) return null;
          throw error;
        });
    })
};

const deleteJSON = {
  description: 'HTTP DELETE input field value to URL via JSON.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    url: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt},
    headers: {type: GraphQLJSON},
    catch: {type: GraphQLBoolean}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      const headers = Object.assign({}, ctx.headers, args.headers, {
        'content-type': 'application/json'
      });
      delete headers['host'];
      delete headers['pragma'];
      delete headers['connection'];
      delete headers['content-length'];
      delete headers['cache-control'];
      delete headers['origin'];
      delete headers['dnt'];
      delete headers['accept'];

      return fetch(
        format(args.url, Object.assign({}, {parent, args, context: ctx, data})),
        {
          method: 'DELETE',
          body: JSON.stringify(
            (data && data.input) || (args && args.input) || data || args.input
          ),
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
            args.jsonQuery
              ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
              : data
        )
        .catch(error => {
          if (args.catch) return null;
          throw error;
        });
    })
};

const publish = {
  description: 'Publish an event using in process Pub/Sub.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    topic: {type: new GraphQLNonNull(GraphQLString)},
    payload: {type: GraphQLJSON}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(result => {
      ctx.pubsub.publish(args.topic, args.payload || result);
      return args.payload || result;
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
  description: 'Execute a process.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    cmd: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(result => {
      const cacheKey = hash(
        Object.assign({scope: info.cacheControl.scope}, args, info.path)
      );
      const cachedValue = LRU.get(cacheKey);
      if (cachedValue) return resolve().then(() => cachedValue);

      return new Promise((resolve, reject) => {
        childProcess.exec(
          args.cmd,
          {
            timeout: parseInt(args.timeout) || 0,
            shell: true,
            cwd: process.cwd()
          },
          (err, stdout, stderr) => {
            if (err) return reject(err);
            if (stderr) return reject(stderr);

            let data = stdout;
            try {
              data = JSON.parse(stdout);
            } catch (error) {}

            resolve(
              args.jsonQuery
                ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
                : data
            );
          }
        );
      }).then(data => {
        if (info.cacheControl.maxAge)
          LRU.set(cacheKey, data, parseInt(info.cacheControl.maxAge));
        return data;
      });
    })
};

const executeBatched = {
  description: 'Execute a process batched.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    cmd: {type: new GraphQLNonNull(GraphQLString)},
    ids: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    timeout: {type: GraphQLInt}
  },
  resolve: (resolve, parent, args, ctx, info) => {
    if (!ctx[`execute-batched-${info.fieldName}`]) {
      ctx[`execute-batched-${info.fieldName}`] = new DataLoader(ids => {
        const cacheKey = hash(
          Object.assign({scope: info.cacheControl.scope}, args, ids)
        );
        const cachedValue = LRU.get(cacheKey);
        if (cachedValue) return resolve().then(() => cachedValue);

        return new Promise((resolve, reject) => {
          childProcess.exec(
            format(
              args.cmd,
              Object.assign(
                {},
                {
                  parent,
                  args,
                  context: ctx,
                  ids
                }
              )
            ),
            {
              timeout: parseInt(args.timeout) || 0,
              shell: true,
              cwd: process.cwd()
            },
            (err, stdout, stderr) => {
              if (err) return reject(err);
              if (stderr) return reject(stderr);

              let data = stdout;
              try {
                data = JSON.parse(stdout);
              } catch (error) {}

              resolve(
                args.jsonQuery
                  ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
                  : data
              );
            }
          );
        }).then(data => {
          if (info.cacheControl.maxAge)
            LRU.set(cacheKey, data, parseInt(info.cacheControl.maxAge));
          return data;
        });
      });
    }
    return resolve().then(() =>
      ctx[`execute-batched-${info.fieldName}`].load(parent[args.ids])
    );
  }
};

const spawn = {
  description: 'Spawn a process and subscribe to output/error stream.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    cmd: {type: new GraphQLNonNull(GraphQLString)},
    catch: {type: GraphQLBoolean}
  },
  resolve: () => ({
    filter: (event, args, ctx) => Boolean(event),
    resolve: (source, args, ctx, info) => source,
    subscribe: (source, args, ctx, info) => {
      args.topic = uuid.v4();
      const [cmd, ...rest] = args.cmd.split(' ');
      let subscriptionId = null;
      let error = null;
      let data = null;

      ctx.pubsub
        .subscribe(args.topic, msg => ({}))
        .then(subId => (subscriptionId = subId));

      const proc = childProcess.spawn(cmd, rest, {
        cwd: process.cwd(),
        shell: true
      });

      proc.stdout.on('data', output => {
        data = output.toString();
        try {
          data = JSON.parse(data);
        } catch (e) {}

        ctx.pubsub.publish(args.topic, {
          data,
          topic: args.topic
        });
      });

      proc.stderr.on('data', output => {
        error = output.toString();
        ctx.pubsub.publish(args.topic, {
          error,
          topic: args.topic
        });
      });

      proc.on('close', code => {
        ctx.pubsub.publish(args.topic, {
          code,
          data,
          error,
          close: true,
          topic: args.topic
        });
        ctx.pubsub.unsubscribe(subscriptionId);
      });

      return subscriptionId;
    }
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

const eventsource = {
  description:
    'Subscribe using HTTP EventSource https://developer.mozilla.org/de/docs/Web/API/EventSource. ',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    topic: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLString)},
    jwt: {type: GraphQLString}
  },
  resolve: () => ({
    filter: (event, args, ctx) => Boolean(event),
    resolve: (source, args, ctx, info) => source,
    subscribe: (source, args, ctx, info) => {
      const headers = {};
      if (args.jwt === 'pass' && ctx.jwt) {
        headers.Authorization = `Bearer ${ctx.jwt}`;
      } else if (args.jwt) {
        headers.Authorization = `Bearer ${args.jwt}`;
      }
      const ev1 = new EventSource(args.url, {headers});
      ev1.onmessage = event => {
        try {
          const evt = JSON.parse(event.data);
          if (Object.keys(evt).length) ctx.pubsub.publish(args.topic, evt);
        } catch (error) {
          ctx.pubsub.publish(args.topic, error);
        }
      };
    }
  })
};

const subscribe = {
  description: 'Subscribe to events using in process Pub/Sub.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    topic: {type: new GraphQLNonNull(GraphQLString)},
    jsonQuery: {type: GraphQLString}
  },
  resolve: () => ({
    filter: (event, args, ctx) => Boolean(event),
    resolve: (source, args, ctx, info) => source,
    subscribe: (source, args, ctx, info) =>
      ctx.pubsub.subscribe(args.topic, msg => ({}))
  })
};

const mapInput = {
  description: 'Map input field property.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    to: {type: new GraphQLNonNull(GraphQLString)},
    from: {type: new GraphQLNonNull(GraphQLString)}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      data = Object.assign({}, {parent, args, context: ctx, data});
      args.input[args.to] = args.from;
      return args;
    })
};

const map = {
  description: 'Map field property.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    to: {type: GraphQLString},
    from: {type: GraphQLString},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    },
    format: {type: GraphQLString}
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      data = Object.assign({}, {parent, args, context: ctx, data});

      if (args.from) return data[args.from];
      if (args.jsonQuery)
        return jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value;
      if (args.format) return args.format;

      if (args.to) return Object.assign({});

      return null;
    })
};

const log = {
  description: 'Log to StdOut.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {},
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      console.log(Object.assign({}, {parent, args, context: ctx, data}));
      return data;
    })
};

const paged = {
  description: 'Slice array to paged results.',
  locations: [DirectiveLocation.FIELD, DirectiveLocation.FIELD_DEFINITION],
  args: {
    skip: {type: new GraphQLNonNull(GraphQLInt)},
    take: {type: new GraphQLNonNull(GraphQLInt)},
    jsonQuery: {
      type: GraphQLString,
      description:
        'Apply JSON-Query projections (https://www.npmjs.com/package/json-query).'
    }
  },
  resolve: (resolve, parent, args, ctx, info) =>
    resolve().then(data => {
      data = args.jsonQuery
        ? jsonQuery(args.jsonQuery, {data, allowRegexp: true}).value
        : data;

      if (Array.isArray(data))
        return data.slice(
          parseInt(args.skip),
          parseInt(args.skip) + parseInt(args.take)
        );

      return Object.values(data).slice(
        parseInt(args.skip),
        parseInt(args.skip) + parseInt(args.take)
      );
    })
};

module.exports = {
  constant,
  mock: constant,
  log,
  paged,
  map,
  mapInput,
  getJSON,
  fetchJSON: getJSON,
  getJSONBatched,
  postJSON,
  putJSON,
  patchJSON,
  deleteJSON,
  publish,
  execute,
  executeBatched,
  spawn,
  complexity,
  contextify,
  eventsource,
  subscribe
};
