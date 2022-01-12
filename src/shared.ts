export type IMethod = "get" | "set" | "remove";
export type IStorageType = "localStorage" | "sessionStorage";

export interface IRequestMessage {
  id: string;
  storageType: IStorageType;
  method: IMethod;
  key: string;
  value?: any;
  returnResult?: boolean;
}

export interface IResponseMessage {
  id: string;
  isResponse: boolean;
  result: any;
}

export const getGUID = () => `${Date.now()}-${Math.random()}`;

export const parseJSON = <T = any>(data: any): T | null => {
  try {
    return JSON.parse(data);
  } catch (err) {
    return null;
  }
};
