import {equal, deepEqual} from 'assert';
import {start, stop} from '../lib';
import {writeFile, remove} from 'fs-extra';
import {resolve} from 'path';

describe('SubKit persistent query', () => {
  const persistentQueryOperationName = 'persistentQuery1';
  const persistentQueryPath = resolve(
    process.cwd(),
    `${persistentQueryOperationName}.gql`
  );
  let url = null;

  before(() =>
    writeFile(
      persistentQueryPath,
      `query ${
        persistentQueryOperationName
      }($take: Int) {items(take: $take) {id}}`
    ).then(() => start({logStyle: 'none'}).then(x => (url = x.url)))
  );
  after(() => remove(persistentQueryPath).then(stop));

  it('Should execute a named persistent, if no dynamic query field was submitted and operation name is matching', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        variables: {take: 10},
        operationName: persistentQueryOperationName
      })
    });
    const actual = await res.json();
    deepEqual(actual.data.items, [{id: '1'}, {id: '2'}, {id: '3'}]);
  });

  it('Should not execute a named persistent query, if dynamic query field was submitted', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        query: `query ${
          persistentQueryOperationName
        }($take: Int) {items(take: $take) {id}}`,
        variables: {take: 10},
        operationName: persistentQueryOperationName
      })
    });
    const actual = await res.json();
    deepEqual(actual.data.items, [{id: '1'}, {id: '2'}, {id: '3'}]);
  });

  it('Should execute normal query', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        query: '{items {id}}',
        variables: null,
        operationName: null
      })
    });
    const actual = await res.json();
    deepEqual(actual.data.items, [{id: '1'}, {id: '2'}, {id: '3'}]);
  });
});
