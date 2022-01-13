import { IMethod, IRequestMessage, IResponseMessage, IStorageType, parseJSON } from "./shared";
import { error } from "./log";
interface IAllowedDomain {
  origin: RegExp;
  allowedMethods?: IMethod[];
  allowedStorageTypes?: IStorageType[];
}
interface IServerConfig {
  allowedDomains: IAllowedDomain[];
  debug?: boolean;
}

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

  const listen = () => window.addEventListener("message", handler);

  const stopListening = () => window.removeEventListener("message", handler);

  return {
    listen,
    stopListening
  };
};

export { getServer };
