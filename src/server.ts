import {
  IMethod,
  IRequestMessage,
  IResponseMessage,
  IStorageType,
  error,
  debugLog
} from "./shared";
interface IAllowedDomain {
  /** RegExp of allowed domain */
  origin: RegExp;
  allowedMethods?: IMethod[];
  allowedStorageTypes?: IStorageType[];
}
interface IServerConfig {
  /** List of allowed domains. Domains not included in this list will be rejected */
  allowedDomains: IAllowedDomain[];
  /** Will log errors and warnings */
  debug?: boolean;
}

/**
 * Creates a server to listen to clients
 *
 * Call `listen` to start accepting client connections
 *
 * ```js
 * const server = getServer({
 * allowedDomains: [
 *    {
 *      origin: /sub1.example.com$/,
 *      allowedMethods: ["get", "set", "remove"]
 *    },
 *    {
 *      origin: /sub2.example.com$/,
 *      allowedMethods: ["get"]
 *    }
 *  ]
 * });
 *
 * await server.listen();
 * ```
 */
const getServer = (config: IServerConfig) => {
  const domains = config.allowedDomains ?? [];
  const debug = config.debug ?? false;
  const clients = new Set<string>();

  const handler = (e: MessageEvent<any>) => {
    const post = postMessage.bind(null, e.origin);

    const initialMessage: IResponseMessage = {
      id: "",
      source: "cross-domain-storage",
      isResponse: true,
      isError: false,
      result: null
    };

    try {
      const data: IRequestMessage = e.data;

      if (data.source !== "cross-domain-storage") return;

      initialMessage.id = data.id;

      const currentDomain = domains.find(d => d.origin.test(e.origin));

      if (!currentDomain) {
        return post({
          ...initialMessage,
          result: `Domain not allowed (${e.origin})`,
          isError: true
        });
      }

      const allowedMethods = currentDomain.allowedMethods ?? ["get", "set", "remove"];
      const allowedStorageTypes = currentDomain.allowedStorageTypes ?? [
        "localStorage",
        "sessionStorage"
      ];

      if (!allowedMethods.includes(data.method)) {
        return post({
          ...initialMessage,
          result: `Method not allowed (${data.method})`,
          isError: true
        });
      }

      if (!allowedStorageTypes.includes(data.storageType)) {
        return post({
          ...initialMessage,
          result: `Storage type not allowed (${data.storageType})`,
          isError: true
        });
      }

      clients.add(e.origin);

      const result = window[data.storageType][`${data.method}Item`](data.key, data.value);

      debugLog(
        debug,
        `[Server] Action executed: ${data.storageType}.${data.method}Item(${data.key}${
          data.value ? `, ${data.value}` : ""
        })`
      );

      post({ ...initialMessage, result });
    } catch (err) {
      error(debug, err);
    }
  };

  /** Start listening for incoming connections */
  const listen = () => {
    window.addEventListener("message", handler);
    debugLog(debug, "[Server] Listening for incoming connections");
  };

  /** Stop listening for incoming connections */
  const stopListening = () => {
    window.removeEventListener("message", handler);
    debugLog(debug, "[Server] Stopped listening for incoming connections");
  };

  return {
    listen,
    stopListening,
    get clients() {
      return [...clients];
    }
  };
};

const postMessage = (origin: string, message: IResponseMessage) => {
  window.top?.postMessage(message, origin);
};

export { getServer };
