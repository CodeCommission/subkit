import {equal, deepEqual} from 'assert';
import {start, stop} from '../lib';

describe('SubKit @execute directive', () => {
  let url = null;

  before(() => start({logStyle: 'none'}).then(x => (url = x.url)));
  after(() => stop());

  it('Should execute a script', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        query: `{
          items @execute(cmd: "test/fixtures/fetch-items") {
            id
          }
        }`,
        variables: null,
        operationName: null
      })
    });
    const actual = await res.json();
    deepEqual(actual.data.items, [{id: 'A'}, {id: 'B'}]);
  });

  it('Should execute a script and template string args', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        query: `query demo($id: ID!) {
          item(id: $id) @execute(cmd: "test/fixtures/fetch-item \${context.variables.id} '\${JSON.stringify({variables: context.variables})}'") {
            id
          }
        }`,
        variables: {id: 'A'},
        operationName: 'demo'
      })
    });
    const actual = await res.json();
    deepEqual(actual.data.item, {id: 'A'});
  });
});
