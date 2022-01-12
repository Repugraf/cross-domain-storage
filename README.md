# Cross Domain Storage

Enables shared cross domain localStorage and sessionStorage

## Installation

`npm i @repugraf/cross-domain-storage`

## Example

### Server/host

```js
import { getServer } from "@repugraf/cross-domain-storage";

const server = getServer({
  allowedDomains: [
    {
      origin: /sub1.example.com$/,
      allowedMethods: ["get", "set", "remove"]
    },
    {
      origin: /sub2.example.com$/,
      allowedMethods: ["get"]
    }
  ]
});

await server.listen();
```

### Client

```js
import { getClient } from "@repugraf/cross-domain-storage";

const client = getClient({
  domain: "https://www.example.com"
});

await client.connect();

await client.set("key", "val");

await client.get("key"); // "val"
```

## TypeScript

The library includes build in typescript definitions.
