import {
  createMessage,
  ICreateMessageProps,
  IResponseMessage,
  IStorageType,
  error,
  debugLog
} from "./shared";

interface IClientConfig {
  /** Domain to connect to */
  domain: string;
  /** Timeout limit in ms after which action will be rejected (default - `10000`) */
  timeout?: number;
  /** Will log errors and warnings */
  debug?: boolean;
  /** Target element for iframe (default `document.body`) */
  target?: HTMLElement;
  /** Duplicates storage operation into current domain storage */
  duplicate?: boolean;
  /** If cross domain operation fails will fallback to current domain storage operations */
  fallback?: boolean;
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
  const timeout = config.timeout ?? 10000;
  const debug = config.debug ?? false;
  const target = config.target ?? document.body;
  const duplicate = config.duplicate ?? false;
  const fallback = config.fallback ?? false;

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
   * @param _timeout Timeout after which the method will reject
   */
  const connect = (_timeout = timeout): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const timeoutID = setTimeout(() => reject(false), _timeout);

      iframe.onload = () => {
        clearTimeout(timeoutID);
        isConnected = true;
        debugLog(debug, `Connected to server (${config.domain})`);
        resolve();
      };

      iframe.onerror = e => {
        clearTimeout(timeoutID);
        error(debug, `Failed to connect to server (${config.domain})`, e);
        reject(e);
      };

      target.appendChild(iframe);
    }).catch(e => error(debug, e));
  };

  /**
   * Disconnect from specified domain
   *
   * Under the hood will remove invisible iframe from `document.body`
   */
  const disconnect = () => {
    target.removeChild(iframe);
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
    });
  };

  const get = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "get",
      key,
      storageType
    });
  };

  const remove = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "remove",
      key,
      storageType
    });
  };

  const handleOperation = async (
    props: ICreateMessageProps
  ): Promise<IResponseMessage["result"]> => {
    const message = createMessage({
      method: props.method,
      key: props.key,
      value: props.value,
      storageType: props.storageType ?? "localStorage"
    });

    try {
      const { result } = await new Promise<IResponseMessage>((resolve, reject) => {
        const clearListener = () => window.removeEventListener("message", handler);

        const timeoutID = setTimeout(() => {
          clearListener();
          reject(new Error(`Timeout (${timeout})`));
        }, timeout);

        const handler = (e: MessageEvent<any>) => {
          const response: IResponseMessage = e.data;

          if (!response || response.source !== "cross-domain-storage" || message.id !== response.id)
            return;

          clearTimeout(timeoutID);

          return response.isError ? reject(new Error(response.result)) : resolve(response);
        };

        window.addEventListener("message", handler);

        if (!isConnected || !iframe.contentWindow) {
          clearListener();
          return reject(new Error("Not connected"));
        }

        iframe.contentWindow.postMessage(message, config.domain);

        if (duplicate)
          window[message.storageType][`${message.method}Item`](message.key, message.value);
      });

      debugLog(
        debug,
        `[Client] Action executed: ${message.storageType}.${message.method}Item(${message.key}${
          message.value ? `, ${message.value}` : ""
        })`
      );

      return result;
    } catch (err) {
      error(debug, err);

      if (fallback)
        return window[message.storageType][`${message.method}Item`](message.key, message.value);
    }
  };

  return {
    connect,
    disconnect,
    set,
    get,
    remove,
    get isConnected() {
      return isConnected;
    }
  };
};

export { getClient };
