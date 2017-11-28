import {equal, deepEqual} from 'assert';
import {start, stop} from '../lib';

describe('SubKit @contextify directive', () => {
  let url = null;

  before(() => start({logStyle: 'none'}).then(x => (url = x.url)));
  after(() => stop());

  it('Should contextify values', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        query: `{
          viewer(id: "go@subkit.io") @contextify {
            items {
              id
            }
          }
        }`,
        variables: null,
        operationName: null
      })
    });
    const actual = await res.json();
    deepEqual(actual.data, {
      viewer: {items: [{id: '1'}]}
    });
  });
});
