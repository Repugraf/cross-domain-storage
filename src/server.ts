import {
  IMethod,
  IRequestMessage,
  IResponseMessage,
  IStorageType,
  parseJSON,
  error
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

  const handler = (e: MessageEvent<any>) => {
    try {
      const currentDomain = domains.find(d => d.origin.test(e.origin));

      if (!currentDomain) return error(debug, `Domain not allowed (${e.origin})`);

      const allowedMethods = currentDomain.allowedMethods ?? ["get", "set", "remove"];
      const allowedStorageTypes = currentDomain.allowedStorageTypes ?? [
        "localStorage",
        "sessionStorage"
      ];

      const data = parseJSON<IRequestMessage>(e.data);

      if (!data) return error(debug, "Failed to parse json or data is invalid");

      if (!allowedMethods.includes(data.method))
        return error(debug, `Method not allowed (${data.method})`);

      if (!allowedStorageTypes.includes(data.storageType))
        return error(debug, `Storage type not allowed (${data.storageType})`);

      const result = window[data.storageType][`${data.method}Item`](data.key, data.value);

      window.top?.postMessage(
        JSON.stringify({
          id: data.id,
          isResponse: true,
          result
        } as IResponseMessage),
        e.origin
      );
    } catch (err) {
      error(debug, err);
    }
  };

  /** Start listening for incoming connections */
  const listen = () => window.addEventListener("message", handler);

  /** Stop listening for incoming connections */
  const stopListening = () => window.removeEventListener("message", handler);

  return {
    listen,
    stopListening
  };
};

export { getServer };
