import "@testing-library/jest-dom";

// Standard localStorage and sessionStorage mock for jsdom / Node environment
const createStorageMock = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (i) => Object.keys(store)[i] || null,
    get length() {
      return Object.keys(store).length;
    }
  };
};

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, "localStorage", {
    value: createStorageMock(),
    writable: true
  });
}

if (!globalThis.sessionStorage) {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: createStorageMock(),
    writable: true
  });
}

