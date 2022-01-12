import { IMethod, IRequestMessage, IResponseMessage, IStorageType, parseJSON } from "./shared";

interface IAllowedDomain {
  origin: RegExp;
  allowedMethods: IMethod[];
  allowedStorageTypes: IStorageType[];
}
interface IServerConfig {
  allowedDomains: IAllowedDomain[];
}

const getServer = (config: IServerConfig) => {
  const domains = config.allowedDomains ?? [];

  const handler = (e: MessageEvent<any>) => {
    const allowed = domains.some(d => d.origin.test(e.origin));

    if (!allowed) return;

    const data = parseJSON<IRequestMessage>(e.data);

    if (!data) return;

    const result = window[data.storageType][`${data.method}Item`](data.key, data.value);

    window.top?.postMessage(
      JSON.stringify({
        id: data.id,
        isResponse: true,
        result
      } as IResponseMessage),
      e.origin
    );
  };

  const listen = () => window.addEventListener("message", handler);

  const stopListening = () => window.removeEventListener("message", handler);

  return {
    listen,
    stopListening
  };
};

export { getServer };
