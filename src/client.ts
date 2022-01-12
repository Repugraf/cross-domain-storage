import { getGUID, IRequestMessage, IResponseMessage, IStorageType, parseJSON } from "./shared";

interface IClientConfig {
  domain: string;
  timeout?: number;
}

interface ICreateMessageProps {
  storageType?: IRequestMessage["storageType"];
  method: IRequestMessage["method"];
  key: IRequestMessage["key"];
  value?: IRequestMessage["value"];
  returnResult?: IRequestMessage["returnResult"];
}

const createMessage = (props: ICreateMessageProps): IRequestMessage => {
  return {
    id: getGUID(),
    storageType: props.storageType ?? "localStorage",
    method: props.method,
    key: props.key,
    value: props.value,
    returnResult: props.value
  };
};

const getClient = (config: IClientConfig) => {
  const _timeout = config.timeout ?? 10000;

  const iframe = document.createElement("iframe");

  iframe.setAttribute("src", config.domain);
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.display = "none";

  let isConnected = false;

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
    });
  };

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
    }).then(r => r.result);
  };

  const get = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "get",
      key,
      storageType
    }).then(r => r.result);
  };

  const remove = (key: string, storageType?: IStorageType) => {
    return handleOperation({
      method: "remove",
      key,
      storageType
    }).then(r => r.result);
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
