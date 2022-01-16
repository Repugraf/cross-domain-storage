export type IMethod = "get" | "set" | "remove";
export type IStorageType = "localStorage" | "sessionStorage";

export interface IRequestMessage {
  id: string;
  source: "cross-domain-storage";
  storageType: IStorageType;
  method: IMethod;
  key: string;
  value?: any;
  returnResult?: boolean;
}

export interface IResponseMessage {
  id: string;
  source: "cross-domain-storage";
  isError: boolean;
  isResponse: boolean;
  result: any;
}

export const getGUID = () => `${Date.now()}-${Math.random()}`;

export interface ICreateMessageProps {
  storageType?: IRequestMessage["storageType"];
  method: IRequestMessage["method"];
  key: IRequestMessage["key"];
  value?: IRequestMessage["value"];
  returnResult?: IRequestMessage["returnResult"];
}

export const createMessage = (props: ICreateMessageProps): IRequestMessage => {
  return {
    id: getGUID(),
    source: "cross-domain-storage",
    storageType: props.storageType ?? "localStorage",
    method: props.method,
    key: props.key,
    value: props.value,
    returnResult: props.value
  };
};

export const error = (debug?: boolean, ...args: any[]) => {
  if (debug) console.error(...args);
};

export const debugLog = (debug?: boolean, ...args: any[]) => {
  if (debug) console.log(...args);
};
