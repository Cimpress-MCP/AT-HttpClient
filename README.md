# ATSquad HTTP Client

A wrapper around axios with retry and caching logic, bearer token injection through custom resolvers, and extended logging.

## Using this library

Install the library.

```bash
yarn add @atsquad/httpclient
```

```javascript
const HttpClient = require('@atsquad/httpclient');
const Logger = require('@atsquad/logger');

let logger = new Logger();
let httpClient = new HttpClient({
  logFunction: msg => logger.log(msg),
  tokenResolver: () => "exampleAccessToken"
});

let headers = {};
let data = { exampleProperty: 'exampleValue' };

let getResponse = await httpClient.get('VALID_URL', { headers });
let postResponse = await httpClient.post('VALID_URL', data, { headers });
let putResponse = await httpClient.put('VALID_URL', data, { headers });
```

If you wish to override [the axios defaults](https://github.com/axios/axios#config-defaults) and/or add your [own interceptors](https://github.com/axios/axios#interceptors),
provide an [axios instance](https://github.com/axios/axios) in the configuration object.

```javascript
const axios = require('axios');
let axiosClient = axios.create({ timeout: 3000 });
new HttpClient({ client: axiosClient });
```

## Contribution

We value your input as part of direct feedback to us, by filing issues, or preferably by directly contributing improvements:

1. Fork this repository
1. Create a branch
1. Contribute
1. Pull request
