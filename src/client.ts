import {
  createMessage,
  ICreateMessageProps,
  IResponseMessage,
  IStorageType,
  parseJSON,
  error
} from "./shared";

interface IClientConfig {
  /** Domain to connect to */
  domain: string;
  /** Timeout limit in ms after which action will be rejected (default - `10000`) */
  timeout?: number;
  /** Will log errors and warnings */
  debug?: boolean;
}

/**
 * Creates client instance
 *
 * Call `connect` to start communications with the server
 *
 * ```js
 * const client = getClient({
 *   domain: "https://www.example.com"
 * });
 *
 * await client.connect();
 *
 * await client.set("key", "val");
 *
 * await client.get("key");
 * ```
 */
const getClient = (config: IClientConfig) => {
  const _timeout = config.timeout ?? 10000;
  const debug = config.debug ?? false;

  const iframe = document.createElement("iframe");

  iframe.setAttribute("src", config.domain);
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.display = "none";

  let isConnected = false;

  /**
   * Connects to specified domain
   *
   * Under the hood will append invisible iframe to `document.body` with `src` of specified domain
   *
   * @param timeout Timeout after which the method will reject
   */
  const connect = (timeout = _timeout) => {
    return new Promise((resolve, reject) => {
      const timeoutID = setTimeout(() => reject(false), timeout);

      iframe.onload = () => {
        clearTimeout(timeoutID);
        isConnected = true;
        resolve(true);
      };

      iframe.onerror = e => {
        clearTimeout(timeoutID);
        reject(e);
      };

      document.body.appendChild(iframe);
    }).catch(e => error(debug, e));
  };

  /**
   * Disconnect from specified domain
   *
   * Under the hood will remove invisible iframe from `document.body`
   */
  const disconnect = () => {
    document.body.removeChild(iframe);
    isConnected = false;
  };

  const set = (
    key: string,
    value: string,
    storageType?: IStorageType
  ): Promise<IResponseMessage> => {
    return handleOperation({
      method: "set",
      key,
      value,
      storageType
    })
      .then(r => r.result)
      .catch(e => error(debug, e));
  };

  const get = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "get",
      key,
      storageType
    })
      .then(r => r.result)
      .catch(e => error(debug, e));
  };

  const remove = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "remove",
      key,
      storageType
    })
      .then(r => r.result)
      .catch(e => error(debug, e));
  };

  const handleOperation = (props: ICreateMessageProps): Promise<IResponseMessage> => {
    const message = createMessage({
      method: props.method,
      key: props.key,
      value: props.value,
      storageType: props.storageType ?? "localStorage"
    });

    return new Promise((resolve, reject) => {
      const clearListener = () => window.removeEventListener("message", handler);

      const timeoutID = setTimeout(() => {
        clearListener();
        reject(new Error(`Timeout (${_timeout})`));
      }, _timeout);

      const handler = (e: MessageEvent<any>) => {
        const response = parseJSON<IResponseMessage>(e.data);

        if (!response) return;

        if (message.id === response.id) {
          clearTimeout(timeoutID);
          return resolve(response);
        }
      };

      window.addEventListener("message", handler);

      if (!isConnected || !iframe.contentWindow) {
        clearListener();
        return reject(new Error("Not connected"));
      }

      iframe.contentWindow.postMessage(JSON.stringify(message), config.domain);
    });
  };

  return {
    connect,
    disconnect,
    set,
    get,
    remove
  };
};

export { getClient };
