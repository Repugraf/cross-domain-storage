export const log = (debug?: boolean, ...args: any[]) => {
  if (debug) console.log(...args);
};

export const debug = (debug?: boolean, ...args: any[]) => {
  if (debug) console.debug(...args);
};

export const warn = (debug?: boolean, ...args: any[]) => {
  if (debug) console.warn(...args);
};

export const error = (debug?: boolean, ...args: any[]) => {
  if (debug) console.error(...args);
};
