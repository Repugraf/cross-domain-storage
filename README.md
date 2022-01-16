# Cross Domain Storage

Enables shared cross domain localStorage and sessionStorage.

## How it works

1. Server  
   Listens for a window messages from allowed domains.
   If the client domain, method or storage type is not allowed the message will send back error message.
2. Client  
   On Connections creates an invisible iframe with specified domain as `src` attribute and appends it to `document.body`.
   Client communicates with that iframe through posting and listing to messages.

All communications are handled with `iframe.contentWindow.postMessage`, `window.top.postMessage` and `window.addEventListener`

## Installation

### NPM

```sh
npm i @repugraf/cross-domain-storage
```

### ESM

```js
import { getServer, getClient } from "https://esm.sh/@repugraf/cross-domain-storage";
```

## Usage

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

## Documentation

The library is documented with JSDoc and TypeScript definitions.
All details and types should be highlighted in most commonly used IDEs (VSCode, WebStorm)

## TypeScript

The library includes build in typescript definitions.
