import fetch from 'isomorphic-fetch'
import {equal} from 'assert'
import {start, stop} from '../lib'

describe('Subkit server integration tests', () => {
  let url = null

  before(() => start({}).then(x => url = x.url))
  after(() => stop())

  it('Response with 200', async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({
        query: `{
          items {
            id
          }
        }`,
        variables: null,
        operationName: null,
      }),
    })

    equal(res.status, 200)
  })
})