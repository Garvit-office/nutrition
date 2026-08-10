if (typeof globalThis.DOMException === "undefined") {
  class DOMExceptionPolyfill extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || "DOMException";
    }
  }
  globalThis.DOMException = DOMExceptionPolyfill;
  if (typeof global !== "undefined") {
    global.DOMException = DOMExceptionPolyfill;
  }
}
