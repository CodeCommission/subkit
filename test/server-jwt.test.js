import fetch from "isomorphic-fetch";
import { equal } from "assert";
import { start, stop } from "../lib";

describe("Subkit server JWT integration tests", () => {
  let url = null;

  before(() => start({ secret: "demo" }).then(x => (url = x.url)));
  after(() => stop());

  it("Response with 401", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        query: `{
          items{
            id
          }
        }`,
        variables: null,
        operationName: null
      })
    });

    equal(res.status, 401);
  });

  it("Response with 200", async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE0OTc1NDQ4MDMsImV4cCI6MTUyOTA4MDg1NCwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsImVtYWlsIjoiZGVtb0BleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiJ9.QqQXJfibmf9HkWqLMOoJLYPNih1NDEi7PyirY_V5Al8"
      },
      body: JSON.stringify({
        query: `{
          items{
            id
          }
        }`,
        variables: null,
        operationName: null
      })
    });

    equal(res.status, 200);
  });
});
