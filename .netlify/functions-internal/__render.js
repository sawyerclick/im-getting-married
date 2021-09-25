var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __require = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require3() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* read(parts) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else {
      yield part;
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    if (isBlob(value)) {
      length += value.size;
    } else {
      length += Buffer.byteLength(String(value));
    }
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = body.stream();
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const err = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(err);
        throw err;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    if (error2 instanceof FetchBaseError) {
      throw error2;
    } else {
      throw new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    }
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (err) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, "system", err));
      finalize();
    });
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              try {
                headers.set("Location", locationURL);
              } catch (error2) {
                reject(error2);
              }
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
        }
      }
      response_.once("end", () => {
        if (signal) {
          signal.removeEventListener("abort", abortAndFinalize);
        }
      });
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
        reject(error2);
      });
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), (error2) => {
          reject(error2);
        });
        raw.once("data", (chunk) => {
          if ((chunk[0] & 15) === 8) {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), (error2) => {
              reject(error2);
            });
          } else {
            body = (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), (error2) => {
              reject(error2);
            });
          }
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), (error2) => {
          reject(error2);
        });
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, src, dataUriToBuffer$1, Readable, wm, Blob2, fetchBlob, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ({ Readable } = import_stream.default);
    wm = new WeakMap();
    Blob2 = class {
      constructor(blobParts = [], options2 = {}) {
        let size = 0;
        const parts = blobParts.map((element) => {
          let buffer;
          if (element instanceof Buffer) {
            buffer = element;
          } else if (ArrayBuffer.isView(element)) {
            buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
          } else if (element instanceof ArrayBuffer) {
            buffer = Buffer.from(element);
          } else if (element instanceof Blob2) {
            buffer = element;
          } else {
            buffer = Buffer.from(typeof element === "string" ? element : String(element));
          }
          size += buffer.length || buffer.size || 0;
          return buffer;
        });
        const type = options2.type === void 0 ? "" : String(options2.type).toLowerCase();
        wm.set(this, {
          type: /[^\u0020-\u007E]/.test(type) ? "" : type,
          size,
          parts
        });
      }
      get size() {
        return wm.get(this).size;
      }
      get type() {
        return wm.get(this).type;
      }
      async text() {
        return Buffer.from(await this.arrayBuffer()).toString();
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset = 0;
        for await (const chunk of this.stream()) {
          data.set(chunk, offset);
          offset += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        return Readable.from(read(wm.get(this).parts));
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = wm.get(this).parts.values();
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            const chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
            blobParts.push(chunk);
            added += ArrayBuffer.isView(chunk) ? chunk.byteLength : chunk.size;
            relativeStart = 0;
            if (added >= span) {
              break;
            }
          }
        }
        const blob = new Blob2([], { type: String(type).toLowerCase() });
        Object.assign(wm.get(blob), { size: span, parts: blobParts });
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.stream === "function" && object.stream.length === 0 && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(Blob2.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    fetchBlob = Blob2;
    Blob$1 = fetchBlob;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && object[NAME] === "AbortSignal";
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (err) => {
            const error2 = err instanceof FetchBaseError ? err : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${err.message}`, "system", err);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        body.stream().pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const err = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw err;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const err = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(err, "code", { value: "ERR_INVALID_CHAR" });
        throw err;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(receiver, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback) {
        for (const name of this.keys()) {
          callback(this.get(name), name);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status || 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url).toString()
          },
          status
        });
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal !== null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-netlify/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-netlify/files/shims.js"() {
    init_install_fetch();
  }
});

// node_modules/canvas-confetti/src/confetti.js
var require_confetti = __commonJS({
  "node_modules/canvas-confetti/src/confetti.js"(exports, module2) {
    init_shims();
    (function main(global, module3, isWorker, workerSize) {
      var canUseWorker = !!(global.Worker && global.Blob && global.Promise && global.OffscreenCanvas && global.OffscreenCanvasRenderingContext2D && global.HTMLCanvasElement && global.HTMLCanvasElement.prototype.transferControlToOffscreen && global.URL && global.URL.createObjectURL);
      function noop2() {
      }
      function promise(func) {
        var ModulePromise = module3.exports.Promise;
        var Prom = ModulePromise !== void 0 ? ModulePromise : global.Promise;
        if (typeof Prom === "function") {
          return new Prom(func);
        }
        func(noop2, noop2);
        return null;
      }
      var raf2 = function() {
        var TIME = Math.floor(1e3 / 60);
        var frame, cancel;
        var frames = {};
        var lastFrameTime = 0;
        if (typeof requestAnimationFrame === "function" && typeof cancelAnimationFrame === "function") {
          frame = function(cb) {
            var id = Math.random();
            frames[id] = requestAnimationFrame(function onFrame(time) {
              if (lastFrameTime === time || lastFrameTime + TIME - 1 < time) {
                lastFrameTime = time;
                delete frames[id];
                cb();
              } else {
                frames[id] = requestAnimationFrame(onFrame);
              }
            });
            return id;
          };
          cancel = function(id) {
            if (frames[id]) {
              cancelAnimationFrame(frames[id]);
            }
          };
        } else {
          frame = function(cb) {
            return setTimeout(cb, TIME);
          };
          cancel = function(timer) {
            return clearTimeout(timer);
          };
        }
        return { frame, cancel };
      }();
      var getWorker = function() {
        var worker;
        var prom;
        var resolves = {};
        function decorate(worker2) {
          function execute(options2, callback) {
            worker2.postMessage({ options: options2 || {}, callback });
          }
          worker2.init = function initWorker(canvas) {
            var offscreen = canvas.transferControlToOffscreen();
            worker2.postMessage({ canvas: offscreen }, [offscreen]);
          };
          worker2.fire = function fireWorker(options2, size, done) {
            if (prom) {
              execute(options2, null);
              return prom;
            }
            var id = Math.random().toString(36).slice(2);
            prom = promise(function(resolve2) {
              function workerDone(msg) {
                if (msg.data.callback !== id) {
                  return;
                }
                delete resolves[id];
                worker2.removeEventListener("message", workerDone);
                prom = null;
                done();
                resolve2();
              }
              worker2.addEventListener("message", workerDone);
              execute(options2, id);
              resolves[id] = workerDone.bind(null, { data: { callback: id } });
            });
            return prom;
          };
          worker2.reset = function resetWorker() {
            worker2.postMessage({ reset: true });
            for (var id in resolves) {
              resolves[id]();
              delete resolves[id];
            }
          };
        }
        return function() {
          if (worker) {
            return worker;
          }
          if (!isWorker && canUseWorker) {
            var code = [
              "var CONFETTI, SIZE = {}, module = {};",
              "(" + main.toString() + ")(this, module, true, SIZE);",
              "onmessage = function(msg) {",
              "  if (msg.data.options) {",
              "    CONFETTI(msg.data.options).then(function () {",
              "      if (msg.data.callback) {",
              "        postMessage({ callback: msg.data.callback });",
              "      }",
              "    });",
              "  } else if (msg.data.reset) {",
              "    CONFETTI.reset();",
              "  } else if (msg.data.resize) {",
              "    SIZE.width = msg.data.resize.width;",
              "    SIZE.height = msg.data.resize.height;",
              "  } else if (msg.data.canvas) {",
              "    SIZE.width = msg.data.canvas.width;",
              "    SIZE.height = msg.data.canvas.height;",
              "    CONFETTI = module.exports.create(msg.data.canvas);",
              "  }",
              "}"
            ].join("\n");
            try {
              worker = new Worker(URL.createObjectURL(new Blob([code])));
            } catch (e) {
              typeof console !== void 0 && typeof console.warn === "function" ? console.warn("\u{1F38A} Could not load worker", e) : null;
              return null;
            }
            decorate(worker);
          }
          return worker;
        };
      }();
      var defaults = {
        particleCount: 50,
        angle: 90,
        spread: 45,
        startVelocity: 45,
        decay: 0.9,
        gravity: 1,
        drift: 0,
        ticks: 200,
        x: 0.5,
        y: 0.5,
        shapes: ["square", "circle"],
        zIndex: 100,
        colors: [
          "#26ccff",
          "#a25afd",
          "#ff5e7e",
          "#88ff5a",
          "#fcff42",
          "#ffa62d",
          "#ff36ff"
        ],
        disableForReducedMotion: false,
        scalar: 1
      };
      function convert(val, transform) {
        return transform ? transform(val) : val;
      }
      function isOk(val) {
        return !(val === null || val === void 0);
      }
      function prop(options2, name, transform) {
        return convert(options2 && isOk(options2[name]) ? options2[name] : defaults[name], transform);
      }
      function onlyPositiveInt(number) {
        return number < 0 ? 0 : Math.floor(number);
      }
      function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
      }
      function toDecimal(str) {
        return parseInt(str, 16);
      }
      function colorsToRgb(colors) {
        return colors.map(hexToRgb);
      }
      function hexToRgb(str) {
        var val = String(str).replace(/[^0-9a-f]/gi, "");
        if (val.length < 6) {
          val = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
        }
        return {
          r: toDecimal(val.substring(0, 2)),
          g: toDecimal(val.substring(2, 4)),
          b: toDecimal(val.substring(4, 6))
        };
      }
      function getOrigin(options2) {
        var origin = prop(options2, "origin", Object);
        origin.x = prop(origin, "x", Number);
        origin.y = prop(origin, "y", Number);
        return origin;
      }
      function setCanvasWindowSize(canvas) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
      }
      function setCanvasRectSize(canvas) {
        var rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
      function getCanvas(zIndex) {
        var canvas = document.createElement("canvas");
        canvas.style.position = "fixed";
        canvas.style.top = "0px";
        canvas.style.left = "0px";
        canvas.style.pointerEvents = "none";
        canvas.style.zIndex = zIndex;
        return canvas;
      }
      function ellipse(context, x, y, radiusX, radiusY, rotation, startAngle, endAngle, antiClockwise) {
        context.save();
        context.translate(x, y);
        context.rotate(rotation);
        context.scale(radiusX, radiusY);
        context.arc(0, 0, 1, startAngle, endAngle, antiClockwise);
        context.restore();
      }
      function randomPhysics(opts) {
        var radAngle = opts.angle * (Math.PI / 180);
        var radSpread = opts.spread * (Math.PI / 180);
        return {
          x: opts.x,
          y: opts.y,
          wobble: Math.random() * 10,
          velocity: opts.startVelocity * 0.5 + Math.random() * opts.startVelocity,
          angle2D: -radAngle + (0.5 * radSpread - Math.random() * radSpread),
          tiltAngle: Math.random() * Math.PI,
          color: opts.color,
          shape: opts.shape,
          tick: 0,
          totalTicks: opts.ticks,
          decay: opts.decay,
          drift: opts.drift,
          random: Math.random() + 5,
          tiltSin: 0,
          tiltCos: 0,
          wobbleX: 0,
          wobbleY: 0,
          gravity: opts.gravity * 3,
          ovalScalar: 0.6,
          scalar: opts.scalar
        };
      }
      function updateFetti(context, fetti) {
        fetti.x += Math.cos(fetti.angle2D) * fetti.velocity + fetti.drift;
        fetti.y += Math.sin(fetti.angle2D) * fetti.velocity + fetti.gravity;
        fetti.wobble += 0.1;
        fetti.velocity *= fetti.decay;
        fetti.tiltAngle += 0.1;
        fetti.tiltSin = Math.sin(fetti.tiltAngle);
        fetti.tiltCos = Math.cos(fetti.tiltAngle);
        fetti.random = Math.random() + 5;
        fetti.wobbleX = fetti.x + 10 * fetti.scalar * Math.cos(fetti.wobble);
        fetti.wobbleY = fetti.y + 10 * fetti.scalar * Math.sin(fetti.wobble);
        var progress = fetti.tick++ / fetti.totalTicks;
        var x1 = fetti.x + fetti.random * fetti.tiltCos;
        var y1 = fetti.y + fetti.random * fetti.tiltSin;
        var x2 = fetti.wobbleX + fetti.random * fetti.tiltCos;
        var y2 = fetti.wobbleY + fetti.random * fetti.tiltSin;
        context.fillStyle = "rgba(" + fetti.color.r + ", " + fetti.color.g + ", " + fetti.color.b + ", " + (1 - progress) + ")";
        context.beginPath();
        if (fetti.shape === "circle") {
          context.ellipse ? context.ellipse(fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI) : ellipse(context, fetti.x, fetti.y, Math.abs(x2 - x1) * fetti.ovalScalar, Math.abs(y2 - y1) * fetti.ovalScalar, Math.PI / 10 * fetti.wobble, 0, 2 * Math.PI);
        } else {
          context.moveTo(Math.floor(fetti.x), Math.floor(fetti.y));
          context.lineTo(Math.floor(fetti.wobbleX), Math.floor(y1));
          context.lineTo(Math.floor(x2), Math.floor(y2));
          context.lineTo(Math.floor(x1), Math.floor(fetti.wobbleY));
        }
        context.closePath();
        context.fill();
        return fetti.tick < fetti.totalTicks;
      }
      function animate(canvas, fettis, resizer, size, done) {
        var animatingFettis = fettis.slice();
        var context = canvas.getContext("2d");
        var animationFrame;
        var destroy;
        var prom = promise(function(resolve2) {
          function onDone() {
            animationFrame = destroy = null;
            context.clearRect(0, 0, size.width, size.height);
            done();
            resolve2();
          }
          function update() {
            if (isWorker && !(size.width === workerSize.width && size.height === workerSize.height)) {
              size.width = canvas.width = workerSize.width;
              size.height = canvas.height = workerSize.height;
            }
            if (!size.width && !size.height) {
              resizer(canvas);
              size.width = canvas.width;
              size.height = canvas.height;
            }
            context.clearRect(0, 0, size.width, size.height);
            animatingFettis = animatingFettis.filter(function(fetti) {
              return updateFetti(context, fetti);
            });
            if (animatingFettis.length) {
              animationFrame = raf2.frame(update);
            } else {
              onDone();
            }
          }
          animationFrame = raf2.frame(update);
          destroy = onDone;
        });
        return {
          addFettis: function(fettis2) {
            animatingFettis = animatingFettis.concat(fettis2);
            return prom;
          },
          canvas,
          promise: prom,
          reset: function() {
            if (animationFrame) {
              raf2.cancel(animationFrame);
            }
            if (destroy) {
              destroy();
            }
          }
        };
      }
      function confettiCannon(canvas, globalOpts) {
        var isLibCanvas = !canvas;
        var allowResize = !!prop(globalOpts || {}, "resize");
        var globalDisableForReducedMotion = prop(globalOpts, "disableForReducedMotion", Boolean);
        var shouldUseWorker = canUseWorker && !!prop(globalOpts || {}, "useWorker");
        var worker = shouldUseWorker ? getWorker() : null;
        var resizer = isLibCanvas ? setCanvasWindowSize : setCanvasRectSize;
        var initialized = canvas && worker ? !!canvas.__confetti_initialized : false;
        var preferLessMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion)").matches;
        var animationObj;
        function fireLocal(options2, size, done) {
          var particleCount = prop(options2, "particleCount", onlyPositiveInt);
          var angle = prop(options2, "angle", Number);
          var spread = prop(options2, "spread", Number);
          var startVelocity = prop(options2, "startVelocity", Number);
          var decay = prop(options2, "decay", Number);
          var gravity = prop(options2, "gravity", Number);
          var drift = prop(options2, "drift", Number);
          var colors = prop(options2, "colors", colorsToRgb);
          var ticks = prop(options2, "ticks", Number);
          var shapes = prop(options2, "shapes");
          var scalar = prop(options2, "scalar");
          var origin = getOrigin(options2);
          var temp = particleCount;
          var fettis = [];
          var startX = canvas.width * origin.x;
          var startY = canvas.height * origin.y;
          while (temp--) {
            fettis.push(randomPhysics({
              x: startX,
              y: startY,
              angle,
              spread,
              startVelocity,
              color: colors[temp % colors.length],
              shape: shapes[randomInt(0, shapes.length)],
              ticks,
              decay,
              gravity,
              drift,
              scalar
            }));
          }
          if (animationObj) {
            return animationObj.addFettis(fettis);
          }
          animationObj = animate(canvas, fettis, resizer, size, done);
          return animationObj.promise;
        }
        function fire(options2) {
          var disableForReducedMotion = globalDisableForReducedMotion || prop(options2, "disableForReducedMotion", Boolean);
          var zIndex = prop(options2, "zIndex", Number);
          if (disableForReducedMotion && preferLessMotion) {
            return promise(function(resolve2) {
              resolve2();
            });
          }
          if (isLibCanvas && animationObj) {
            canvas = animationObj.canvas;
          } else if (isLibCanvas && !canvas) {
            canvas = getCanvas(zIndex);
            document.body.appendChild(canvas);
          }
          if (allowResize && !initialized) {
            resizer(canvas);
          }
          var size = {
            width: canvas.width,
            height: canvas.height
          };
          if (worker && !initialized) {
            worker.init(canvas);
          }
          initialized = true;
          if (worker) {
            canvas.__confetti_initialized = true;
          }
          function onResize() {
            if (worker) {
              var obj = {
                getBoundingClientRect: function() {
                  if (!isLibCanvas) {
                    return canvas.getBoundingClientRect();
                  }
                }
              };
              resizer(obj);
              worker.postMessage({
                resize: {
                  width: obj.width,
                  height: obj.height
                }
              });
              return;
            }
            size.width = size.height = null;
          }
          function done() {
            animationObj = null;
            if (allowResize) {
              global.removeEventListener("resize", onResize);
            }
            if (isLibCanvas && canvas) {
              document.body.removeChild(canvas);
              canvas = null;
              initialized = false;
            }
          }
          if (allowResize) {
            global.addEventListener("resize", onResize, false);
          }
          if (worker) {
            return worker.fire(options2, size, done);
          }
          return fireLocal(options2, size, done);
        }
        fire.reset = function() {
          if (worker) {
            worker.reset();
          }
          if (animationObj) {
            animationObj.reset();
          }
        };
        return fire;
      }
      module3.exports = confettiCannon(null, { useWorker: true, resize: true });
      module3.exports.create = confettiCannon;
    })(function() {
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof self !== "undefined") {
        return self;
      }
      return this || {};
    }(), module2, false);
  }
});

// .svelte-kit/netlify/entry.js
__export(exports, {
  handler: () => handler
});
init_shims();

// .svelte-kit/output/server/app.js
init_shims();
var import_canvas_confetti = __toModule(require_confetti());
var __require2 = typeof require !== "undefined" ? require : (x) => {
  throw new Error('Dynamic require of "' + x + '" is not supported');
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _map;
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error$1(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler2 = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler2) {
    return;
  }
  const params = route.params(match);
  const response = await handler2({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error$1(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error$1(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
var unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next = str.charCodeAt(i + 1);
      if (code <= 56319 && (next >= 56320 && next <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
Promise.resolve();
var subscriber_queue$1 = [];
function writable$1(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue$1.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue$1.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue$1.length; i += 2) {
            subscriber_queue$1[i][0](subscriber_queue$1[i + 1]);
          }
          subscriber_queue$1.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
var s$1 = JSON.stringify;
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css2 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url) => css2.add(url));
      if (node.js)
        node.js.forEach((url) => js.add(url));
      if (node.styles)
        node.styles.forEach((content) => styles.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable$1($session);
    const props = {
      stores: {
        page: writable$1(null),
        navigating: writable$1(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css2).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${s$1(page && page.path)},
						query: new URLSearchParams(${page ? s$1(page.query.toString()) : ""}),
						params: ${page && s$1(page.params)}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles.size && !options2.amp ? `<style data-svelte>${Array.from(styles).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url="${url}"`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  return loaded;
}
var s = JSON.stringify;
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  context,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url;
        if (typeof resource === "string") {
          url = resource;
        } else {
          url = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url.split("?")[0]);
        let response;
        const filename = resolved.replace(options2.paths.assets, "").slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d2) => d2.file === filename || d2.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, receiver) {
              async function text() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":${escape$1(body)}}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      context: { ...context }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    context: loaded.context || context,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
var escaped$2 = {
  "<": "\\u003C",
  ">": "\\u003E",
  "/": "\\u002F",
  "\\": "\\\\",
  "\b": "\\b",
  "\f": "\\f",
  "\n": "\\n",
  "\r": "\\r",
  "	": "\\t",
  "\0": "\\0",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029"
};
function escape$1(str) {
  let result = '"';
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$2) {
      result += escaped$2[char];
    } else if (code >= 55296 && code <= 57343) {
      const next = str.charCodeAt(i + 1);
      if (code <= 56319 && next >= 56320 && next <= 57343) {
        result += char + str[++i];
      } else {
        result += `\\u${code.toString(16).toUpperCase()}`;
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
var absolute = /^([a-z]+:)?\/?\//;
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    context: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      context: loaded ? loaded.context : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {},
      body: ""
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let context = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              context,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    context: node_loaded.context,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.context) {
          context = {
            ...context,
            ...loaded.loaded.context
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
var ReadOnlyFormData = class {
  constructor(map) {
    __privateAdd(this, _map, void 0);
    __privateSet(this, _map, map);
  }
  get(key) {
    const value = __privateGet(this, _map).get(key);
    return value && value[0];
  }
  getAll(key) {
    return __privateGet(this, _map).get(key);
  }
  has(key) {
    return __privateGet(this, _map).has(key);
  }
  *[Symbol.iterator]() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *entries() {
    for (const [key, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield [key, value[i]];
      }
    }
  }
  *keys() {
    for (const [key] of __privateGet(this, _map))
      yield key;
  }
  *values() {
    for (const [, value] of __privateGet(this, _map)) {
      for (let i = 0; i < value.length; i += 1) {
        yield value[i];
      }
    }
  }
};
_map = new WeakMap();
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text();
    case "application/json":
      return JSON.parse(text());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text) {
  const { data, append } = read_only_form_data();
  text.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text, boundary) {
  const parts = text.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {},
                    body: ""
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
var identity = (x) => x;
function assign(tar, src2) {
  for (const k in src2)
    tar[k] = src2[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
var is_client = typeof window !== "undefined";
var now = is_client ? () => window.performance.now() : () => Date.now();
var raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
var tasks = new Set();
function run_tasks(now2) {
  tasks.forEach((task) => {
    if (!task.c(now2)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
var current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function getContext(key) {
  return get_current_component().$$.context.get(key);
}
Promise.resolve();
var escaped = {
  '"': "&quot;",
  "'": "&#39;",
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;"
};
function escape(html) {
  return String(html).replace(/["'&<>]/g, (match) => escaped[match]);
}
function each(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
var missing_component = {
  $$render: () => ""
};
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
var on_destroy;
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(parent_component ? parent_component.$$.context : context || []),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html,
        css: {
          code: Array.from(result.css).map((css2) => css2.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function add_classes(classes) {
  return classes ? ` class="${classes}"` : "";
}
function afterUpdate() {
}
var css$1 = {
  code: "#svelte-announcer.svelte-9z6sc{position:absolute;left:0;top:0;clip:rect(0 0 0 0);-webkit-clip-path:inset(50%);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
  map: `{"version":3,"file":"root.svelte","sources":["root.svelte"],"sourcesContent":["<!-- This file is generated by @sveltejs/kit \u2014 do not edit it! -->\\n<script>\\n\\timport { setContext, afterUpdate, onMount } from 'svelte';\\n\\n\\t// stores\\n\\texport let stores;\\n\\texport let page;\\n\\n\\texport let components;\\n\\texport let props_0 = null;\\n\\texport let props_1 = null;\\n\\texport let props_2 = null;\\n\\n\\tsetContext('__svelte__', stores);\\n\\n\\t$: stores.page.set(page);\\n\\tafterUpdate(stores.page.notify);\\n\\n\\tlet mounted = false;\\n\\tlet navigated = false;\\n\\tlet title = null;\\n\\n\\tonMount(() => {\\n\\t\\tconst unsubscribe = stores.page.subscribe(() => {\\n\\t\\t\\tif (mounted) {\\n\\t\\t\\t\\tnavigated = true;\\n\\t\\t\\t\\ttitle = document.title || 'untitled page';\\n\\t\\t\\t}\\n\\t\\t});\\n\\n\\t\\tmounted = true;\\n\\t\\treturn unsubscribe;\\n\\t});\\n<\/script>\\n\\n<svelte:component this={components[0]} {...(props_0 || {})}>\\n\\t{#if components[1]}\\n\\t\\t<svelte:component this={components[1]} {...(props_1 || {})}>\\n\\t\\t\\t{#if components[2]}\\n\\t\\t\\t\\t<svelte:component this={components[2]} {...(props_2 || {})}/>\\n\\t\\t\\t{/if}\\n\\t\\t</svelte:component>\\n\\t{/if}\\n</svelte:component>\\n\\n{#if mounted}\\n\\t<div id=\\"svelte-announcer\\" aria-live=\\"assertive\\" aria-atomic=\\"true\\">\\n\\t\\t{#if navigated}\\n\\t\\t\\t{title}\\n\\t\\t{/if}\\n\\t</div>\\n{/if}\\n\\n<style>\\n\\t#svelte-announcer {\\n\\t\\tposition: absolute;\\n\\t\\tleft: 0;\\n\\t\\ttop: 0;\\n\\t\\tclip: rect(0 0 0 0);\\n\\t\\t-webkit-clip-path: inset(50%);\\n\\t\\t        clip-path: inset(50%);\\n\\t\\toverflow: hidden;\\n\\t\\twhite-space: nowrap;\\n\\t\\twidth: 1px;\\n\\t\\theight: 1px;\\n\\t}</style>"],"names":[],"mappings":"AAsDC,iBAAiB,aAAC,CAAC,AAClB,QAAQ,CAAE,QAAQ,CAClB,IAAI,CAAE,CAAC,CACP,GAAG,CAAE,CAAC,CACN,IAAI,CAAE,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CACnB,iBAAiB,CAAE,MAAM,GAAG,CAAC,CACrB,SAAS,CAAE,MAAM,GAAG,CAAC,CAC7B,QAAQ,CAAE,MAAM,CAChB,WAAW,CAAE,MAAM,CACnB,KAAK,CAAE,GAAG,CACV,MAAM,CAAE,GAAG,AACZ,CAAC"}`
};
var Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { stores } = $$props;
  let { page } = $$props;
  let { components } = $$props;
  let { props_0 = null } = $$props;
  let { props_1 = null } = $$props;
  let { props_2 = null } = $$props;
  setContext("__svelte__", stores);
  afterUpdate(stores.page.notify);
  if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
    $$bindings.stores(stores);
  if ($$props.page === void 0 && $$bindings.page && page !== void 0)
    $$bindings.page(page);
  if ($$props.components === void 0 && $$bindings.components && components !== void 0)
    $$bindings.components(components);
  if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
    $$bindings.props_0(props_0);
  if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
    $$bindings.props_1(props_1);
  if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
    $$bindings.props_2(props_2);
  $$result.css.add(css$1);
  {
    stores.page.set(page);
  }
  return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
    default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
      default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
    })}` : ``}`
  })}

${``}`;
});
var base = "";
var assets = "";
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
var user_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<meta charset="UTF-8" />\n		<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />\n\n		<title>Denise & Sawyer are getting married!</title>\n		<meta\n			name="description"\n			content="We are getting married Halloween 2021 in Austin, Texas. You are invited to the afterparty!"\n		/>\n		<meta property="og:type" content="article" />\n		<meta property="og:url" content="https://married.sawyer.codes" />\n		<meta property="og:description" content="{meta.MetaDescription}" />\n		<meta property="og:title" content="Denise & Sawyer are getting married!" />\n		<meta property="og:image" content="{meta.Image}" />\n\n		<meta name="twitter:image" content="{meta.Image}" />\n		<meta name="twitter:card" content="summary_large_image" />\n		<meta name="twitter:site" content="https://married.sawyer.codes" />\n		<meta name="twitter:title" content="Denise & Sawyer are getting married!" />\n		<meta name="twitter:description" content="{meta.MetaDescription}" />\n\n		<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />\n		<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />\n		<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />\n		<link rel="manifest" href="/site.webmanifest" />\n		<link rel="icon" href="/favicon.ico" />\n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
var options = null;
var default_settings = { paths: { "base": "", "assets": "" } };
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-481d5b66.js",
      css: [assets + "/_app/assets/start-e8cdb125.css", assets + "/_app/assets/vendor-2bedf613.css"],
      js: [assets + "/_app/start-481d5b66.js", assets + "/_app/chunks/vendor-3d727818.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
var d = (s2) => s2.replace(/%23/g, "#").replace(/%3[Bb]/g, ";").replace(/%2[Cc]/g, ",").replace(/%2[Ff]/g, "/").replace(/%3[Ff]/g, "?").replace(/%3[Aa]/g, ":").replace(/%40/g, "@").replace(/%26/g, "&").replace(/%3[Dd]/g, "=").replace(/%2[Bb]/g, "+").replace(/%24/g, "$");
var empty = () => ({});
var manifest = {
  assets: [{ "file": ".DS_Store", "size": 6148, "type": null }, { "file": "about.txt", "size": 378, "type": "text/plain" }, { "file": "android-chrome-192x192.png", "size": 8639, "type": "image/png" }, { "file": "android-chrome-512x512.png", "size": 28591, "type": "image/png" }, { "file": "apple-touch-icon.png", "size": 8420, "type": "image/png" }, { "file": "favicon-16x16.png", "size": 485, "type": "image/png" }, { "file": "favicon-32x32.png", "size": 935, "type": "image/png" }, { "file": "favicon.ico", "size": 15406, "type": "image/vnd.microsoft.icon" }, { "file": "fonts/.DS_Store", "size": 6148, "type": null }, { "file": "fonts/Inconsolata/.DS_Store", "size": 6148, "type": null }, { "file": "fonts/Inconsolata/Inconsolata-VariableFont_wdth,wght.ttf", "size": 343368, "type": "font/ttf" }, { "file": "fonts/Inconsolata/OFL.txt", "size": 4443, "type": "text/plain" }, { "file": "fonts/Inconsolata/README.txt", "size": 6991, "type": "text/plain" }, { "file": "fonts/Inconsolata/static/.DS_Store", "size": 10244, "type": null }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-Black.ttf", "size": 98048, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-Bold.ttf", "size": 98260, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-ExtraBold.ttf", "size": 98268, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-ExtraLight.ttf", "size": 98108, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-Light.ttf", "size": 97956, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-Medium.ttf", "size": 98304, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-Regular.ttf", "size": 97864, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata/Inconsolata-SemiBold.ttf", "size": 98400, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-Black.ttf", "size": 98408, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-Bold.ttf", "size": 98300, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-ExtraBold.ttf", "size": 98328, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-ExtraLight.ttf", "size": 98128, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-Light.ttf", "size": 98184, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-Medium.ttf", "size": 98196, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-Regular.ttf", "size": 97916, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Condensed/Inconsolata_Condensed-SemiBold.ttf", "size": 98268, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-Black.ttf", "size": 98796, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-Bold.ttf", "size": 98764, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-ExtraBold.ttf", "size": 98772, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-ExtraLight.ttf", "size": 98960, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-Light.ttf", "size": 98756, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-Medium.ttf", "size": 98832, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-Regular.ttf", "size": 98540, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_Expanded/Inconsolata_Expanded-SemiBold.ttf", "size": 98836, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-Black.ttf", "size": 98244, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-Bold.ttf", "size": 98104, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-ExtraBold.ttf", "size": 98240, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-ExtraLight.ttf", "size": 98088, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-Light.ttf", "size": 98048, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-Medium.ttf", "size": 98052, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-Regular.ttf", "size": 97840, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraCondensed/Inconsolata_ExtraCondensed-SemiBold.ttf", "size": 98152, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-Black.ttf", "size": 99280, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-Bold.ttf", "size": 99188, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-ExtraBold.ttf", "size": 99252, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-ExtraLight.ttf", "size": 99444, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-Light.ttf", "size": 99280, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-Medium.ttf", "size": 99152, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-Regular.ttf", "size": 98980, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_ExtraExpanded/Inconsolata_ExtraExpanded-SemiBold.ttf", "size": 99244, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-Black.ttf", "size": 98440, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-Bold.ttf", "size": 98348, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-ExtraBold.ttf", "size": 98516, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-ExtraLight.ttf", "size": 98396, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-Light.ttf", "size": 98384, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-Medium.ttf", "size": 98252, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-Regular.ttf", "size": 98064, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiCondensed/Inconsolata_SemiCondensed-SemiBold.ttf", "size": 98456, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-Black.ttf", "size": 98760, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-Bold.ttf", "size": 98740, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-ExtraBold.ttf", "size": 98828, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-ExtraLight.ttf", "size": 98736, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-Light.ttf", "size": 98476, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-Medium.ttf", "size": 98636, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-Regular.ttf", "size": 98292, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_SemiExpanded/Inconsolata_SemiExpanded-SemiBold.ttf", "size": 98740, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-Black.ttf", "size": 97848, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-Bold.ttf", "size": 97800, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-ExtraBold.ttf", "size": 97848, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-ExtraLight.ttf", "size": 97944, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-Light.ttf", "size": 97840, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-Medium.ttf", "size": 97832, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-Regular.ttf", "size": 97768, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraCondensed/Inconsolata_UltraCondensed-SemiBold.ttf", "size": 97848, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-Black.ttf", "size": 99436, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-Bold.ttf", "size": 99444, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-ExtraBold.ttf", "size": 99484, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-ExtraLight.ttf", "size": 99664, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-Light.ttf", "size": 99576, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-Medium.ttf", "size": 99500, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-Regular.ttf", "size": 99428, "type": "font/ttf" }, { "file": "fonts/Inconsolata/static/Inconsolata_UltraExpanded/Inconsolata_UltraExpanded-SemiBold.ttf", "size": 99504, "type": "font/ttf" }, { "file": "fonts/RecoletaRegular/font.woff", "size": 52235, "type": "font/woff" }, { "file": "fonts/RecoletaRegular/font.woff2", "size": 49244, "type": "font/woff2" }, { "file": "site.webmanifest", "size": 305, "type": "application/manifest+json" }],
  layout: "src/routes/__layout.svelte",
  error: ".svelte-kit/build/components/error.svelte",
  routes: [
    {
      type: "page",
      pattern: /^\/$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/invitation\/([^/]+?)\/?$/,
      params: (m) => ({ lang: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/invitation/[lang].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/gallery\/?$/,
      params: empty,
      a: ["src/routes/__layout.svelte", "src/routes/gallery/index.svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "page",
      pattern: /^\/gallery\/([^/]+?)\/?$/,
      params: (m) => ({ name: d(m[1]) }),
      a: ["src/routes/__layout.svelte", "src/routes/gallery/[name].svelte"],
      b: [".svelte-kit/build/components/error.svelte"]
    },
    {
      type: "endpoint",
      pattern: /^\/api\/invitation\/([^/]+?)\.json$/,
      params: (m) => ({ lang: d(m[1]) }),
      load: () => Promise.resolve().then(function() {
        return _lang__json;
      })
    },
    {
      type: "endpoint",
      pattern: /^\/api\/gallery\/([^/]+?)\.json$/,
      params: (m) => ({ name: d(m[1]) }),
      load: () => Promise.resolve().then(function() {
        return _name__json;
      })
    }
  ]
};
var get_hooks = (hooks) => ({
  getSession: hooks.getSession || (() => ({})),
  handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
  handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
  externalFetch: hooks.externalFetch || fetch
});
var module_lookup = {
  "src/routes/__layout.svelte": () => Promise.resolve().then(function() {
    return __layout;
  }),
  ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(function() {
    return error;
  }),
  "src/routes/index.svelte": () => Promise.resolve().then(function() {
    return index$1;
  }),
  "src/routes/invitation/[lang].svelte": () => Promise.resolve().then(function() {
    return _lang_;
  }),
  "src/routes/gallery/index.svelte": () => Promise.resolve().then(function() {
    return index;
  }),
  "src/routes/gallery/[name].svelte": () => Promise.resolve().then(function() {
    return _name_;
  })
};
var metadata_lookup = { "src/routes/__layout.svelte": { "entry": "pages/__layout.svelte-bef6721f.js", "css": ["assets/pages/__layout.svelte-a4328ed7.css", "assets/vendor-2bedf613.css"], "js": ["pages/__layout.svelte-bef6721f.js", "chunks/vendor-3d727818.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-2cca01ab.js", "css": ["assets/vendor-2bedf613.css"], "js": ["error.svelte-2cca01ab.js", "chunks/vendor-3d727818.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-defe7b93.js", "css": ["assets/vendor-2bedf613.css"], "js": ["pages/index.svelte-defe7b93.js", "chunks/vendor-3d727818.js", "chunks/End-512bb055.js"], "styles": [] }, "src/routes/invitation/[lang].svelte": { "entry": "pages/invitation/[lang].svelte-a798e61d.js", "css": ["assets/vendor-2bedf613.css"], "js": ["pages/invitation/[lang].svelte-a798e61d.js", "chunks/vendor-3d727818.js", "chunks/End-512bb055.js"], "styles": [] }, "src/routes/gallery/index.svelte": { "entry": "pages/gallery/index.svelte-30968c74.js", "css": ["assets/vendor-2bedf613.css"], "js": ["pages/gallery/index.svelte-30968c74.js", "chunks/vendor-3d727818.js"], "styles": [] }, "src/routes/gallery/[name].svelte": { "entry": "pages/gallery/[name].svelte-d88a55c6.js", "css": ["assets/vendor-2bedf613.css"], "js": ["pages/gallery/[name].svelte-d88a55c6.js", "chunks/vendor-3d727818.js"], "styles": [] } };
async function load_component(file) {
  const { entry, css: css2, js, styles } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css2.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var invitation = [
  {
    lang: "english",
    title: "spanish of denise and sawyer are getting married",
    cards: [
      {
        text: [
          "Hi!",
          "It's Sawyer & Denise.",
          "We have news!"
        ]
      },
      {
        text: [
          "We're getting married!"
        ],
        special: [
          "confetti"
        ]
      },
      {
        text: [
          "At this point, you know if you're invited to the (very small!) ceremony."
        ]
      },
      {
        text: [
          "October 31, 2021",
          "5:30 p.m. to 6:30 p.m.",
          "Sekrit Theater, Austin, TX"
        ],
        special: [
          "sekrit-theater"
        ]
      },
      {
        text: [
          "But!",
          "There will be a small afterparty at an Airbnb.",
          "You are invited.",
          "Costumes encouraged!"
        ],
        special: [
          "airbnb"
        ]
      },
      {
        special: [
          "end"
        ]
      }
    ]
  },
  {
    lang: "espanol",
    title: "spanish of denise and sawyer are getting married",
    cards: [
      {
        text: [
          "Hola!",
          "It's Sawyer & Denise.",
          "We have news!"
        ]
      },
      {
        text: [
          "We're getting married!"
        ],
        special: [
          "confetti"
        ]
      },
      {
        text: [
          "At this point, you know if you're invited to the (very small!) ceremony."
        ]
      },
      {
        text: [
          "October 31, 2021",
          "5:30 p.m. to 6:30 p.m.",
          "Sekrit Theater, Austin, TX"
        ],
        special: [
          "sekrit-theater"
        ]
      },
      {
        text: [
          "But!",
          "There will be a small afterparty at an Airbnb.",
          "You are invited.",
          "Costumes encouraged!"
        ],
        special: [
          "airbnb"
        ]
      },
      {
        special: [
          "end"
        ]
      }
    ]
  }
];
var get = async ({ params }) => {
  const { lang } = params;
  const match = invitation.find((d2) => d2.lang === lang);
  let otherLangs = invitation.filter((d2) => d2.lang !== lang).map((d2) => d2.lang);
  const body = { match, otherLangs };
  return { body };
};
var _lang__json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  get
});
var _name__json = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module"
});
var _layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<main class="${"h-full w-full min-h-screen bg-gradient-to-b from-gray-50 to-gray-100"}">${slots.default ? slots.default({}) : ``}</main>`;
});
var __layout = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _layout
});
function load$1({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var Error$1 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let { status } = $$props;
  let { error: error2 } = $$props;
  if ($$props.status === void 0 && $$bindings.status && status !== void 0)
    $$bindings.status(status);
  if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
    $$bindings.error(error2);
  return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
});
var error = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Error$1,
  load: load$1
});
var subscriber_queue = [];
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe: subscribe2 };
}
var css = {
  code: "@-webkit-keyframes svelte-genimd-cursorFade{0%,100%{opacity:1}50%{opacity:0}}@keyframes svelte-genimd-cursorFade{0%,100%{opacity:1}50%{opacity:0}}.typewriter-container.svelte-genimd>*:not(.typing):not(.finished-typing){display:none}.typewriter-container.svelte-genimd .finished-typing::after{content:none}.cursor.svelte-genimd .typing::after{content:'\u258C';display:inline-block;color:var(--cursor-color);-webkit-animation:svelte-genimd-cursorFade 1.25s infinite;animation:svelte-genimd-cursorFade 1.25s infinite}.delay.svelte-genimd{visibility:hidden}",
  map: `{"version":3,"file":"Typewriter.svelte","sources":["Typewriter.svelte"],"sourcesContent":["<script>\\n\\timport { onMount, beforeUpdate, onDestroy, createEventDispatcher } from 'svelte'\\n\\timport { typewriter } from './core/modes'\\n\\n\\texport let interval = 30\\n\\texport let cascade = false\\n\\texport let loop = false\\n\\texport let loopRandom = false\\n\\texport let scramble = false\\n\\texport let cursor = true\\n  export let delay = 0\\n\\n  let isMounted = false\\n  let reinit = {}\\n\\n  $: options = { interval, cascade, loop, loopRandom, scramble, cursor, delay, dispatch }\\n\\n  const dispatch = createEventDispatcher()\\n\\n  beforeUpdate(() => (isMounted && (reinit = {})))\\n\\n  onMount(() => (isMounted = true))\\n<\/script>\\n\\n<style>\\n\\t@-webkit-keyframes cursorFade {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\n\\t\\t50% {\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\t}\\n\\n  @keyframes cursorFade {\\n\\t\\t0%,\\n\\t\\t100% {\\n\\t\\t\\topacity: 1;\\n\\t\\t}\\n\\n\\t\\t50% {\\n\\t\\t\\topacity: 0;\\n\\t\\t}\\n\\t}\\n\\n  .typewriter-container > :global(*:not(.typing):not(.finished-typing)) {\\n    display: none;\\n  }\\n\\n  .typewriter-container :global(.finished-typing::after) {\\n    content: none;\\n  }\\n\\n\\t.cursor :global(.typing::after) {\\n\\t\\tcontent: '\u258C';\\n\\t\\tdisplay: inline-block;\\n\\t\\tcolor: var(--cursor-color);\\n\\t\\t-webkit-animation: cursorFade 1.25s infinite;\\n\\t\\t        animation: cursorFade 1.25s infinite;\\n\\t}\\n\\n\\t.delay {\\n\\t\\tvisibility: hidden;\\n\\t}</style>\\n\\n{#key reinit}\\n  <div\\n    use:typewriter={options}\\n    class=\\"typewriter-container\\"\\n    class:cursor\\n    class:delay={options.delay > 0}\\n    style=\\"--cursor-color: {typeof cursor === 'string' ? cursor : 'black'}\\"\\n  >\\n    <slot />\\n  </div>\\n{/key}\\n"],"names":[],"mappings":"AAyBC,mBAAmB,wBAAW,CAAC,AAC9B,EAAE,CACF,IAAI,AAAC,CAAC,AACL,OAAO,CAAE,CAAC,AACX,CAAC,AAED,GAAG,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,AACX,CAAC,AACF,CAAC,AAEA,WAAW,wBAAW,CAAC,AACvB,EAAE,CACF,IAAI,AAAC,CAAC,AACL,OAAO,CAAE,CAAC,AACX,CAAC,AAED,GAAG,AAAC,CAAC,AACJ,OAAO,CAAE,CAAC,AACX,CAAC,AACF,CAAC,AAEA,mCAAqB,CAAW,oCAAoC,AAAE,CAAC,AACrE,OAAO,CAAE,IAAI,AACf,CAAC,AAED,mCAAqB,CAAC,AAAQ,uBAAuB,AAAE,CAAC,AACtD,OAAO,CAAE,IAAI,AACf,CAAC,AAEF,qBAAO,CAAC,AAAQ,cAAc,AAAE,CAAC,AAChC,OAAO,CAAE,GAAG,CACZ,OAAO,CAAE,YAAY,CACrB,KAAK,CAAE,IAAI,cAAc,CAAC,CAC1B,iBAAiB,CAAE,wBAAU,CAAC,KAAK,CAAC,QAAQ,CACpC,SAAS,CAAE,wBAAU,CAAC,KAAK,CAAC,QAAQ,AAC7C,CAAC,AAED,MAAM,cAAC,CAAC,AACP,UAAU,CAAE,MAAM,AACnB,CAAC"}`
};
var Typewriter = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let options2;
  let { interval = 30 } = $$props;
  let { cascade = false } = $$props;
  let { loop: loop2 = false } = $$props;
  let { loopRandom = false } = $$props;
  let { scramble = false } = $$props;
  let { cursor = true } = $$props;
  let { delay = 0 } = $$props;
  const dispatch = createEventDispatcher();
  if ($$props.interval === void 0 && $$bindings.interval && interval !== void 0)
    $$bindings.interval(interval);
  if ($$props.cascade === void 0 && $$bindings.cascade && cascade !== void 0)
    $$bindings.cascade(cascade);
  if ($$props.loop === void 0 && $$bindings.loop && loop2 !== void 0)
    $$bindings.loop(loop2);
  if ($$props.loopRandom === void 0 && $$bindings.loopRandom && loopRandom !== void 0)
    $$bindings.loopRandom(loopRandom);
  if ($$props.scramble === void 0 && $$bindings.scramble && scramble !== void 0)
    $$bindings.scramble(scramble);
  if ($$props.cursor === void 0 && $$bindings.cursor && cursor !== void 0)
    $$bindings.cursor(cursor);
  if ($$props.delay === void 0 && $$bindings.delay && delay !== void 0)
    $$bindings.delay(delay);
  $$result.css.add(css);
  options2 = {
    interval,
    cascade,
    loop: loop2,
    loopRandom,
    scramble,
    cursor,
    delay,
    dispatch
  };
  return `<div class="${[
    "typewriter-container svelte-genimd",
    (cursor ? "cursor" : "") + " " + (options2.delay > 0 ? "delay" : "")
  ].join(" ").trim()}" style="${"--cursor-color: " + escape(typeof cursor === "string" ? cursor : "black")}">${slots.default ? slots.default({}) : ``}</div>`;
});
function cubicOut(t) {
  const f = t - 1;
  return f * f * f + 1;
}
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now() + delay;
    let fn;
    task = loop((now2) => {
      if (now2 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now2 - start;
      if (elapsed > duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
var Progress = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let pct;
  let $progress, $$unsubscribe_progress;
  let $step, $$unsubscribe_step;
  const progress = tweened(0, { duration: 400, easing: cubicOut });
  $$unsubscribe_progress = subscribe(progress, (value) => $progress = value);
  const { length } = getContext("stuff");
  const step = getContext("step");
  $$unsubscribe_step = subscribe(step, (value) => $step = value);
  {
    progress.set($step);
  }
  pct = $progress / length * 100;
  $$unsubscribe_progress();
  $$unsubscribe_step();
  return `<div class="${"fixed top-0 left-0 w-full h-1"}"><div class="${"w-full h-full bg-gray-200 absolute"}" aria-hidden></div>
	<div class="${"h-full bg-purple-700 absolute"}" style="${"width:" + escape(pct) + "%"}" aria-hidden></div>
	<p class="${"z-50 absolute top-2 right-2 leading-none text-md"}">card ${escape($step)} of ${escape(length)}</p></div>`;
});
var PopUp = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $step, $$unsubscribe_step;
  let { link, text } = $$props;
  const step = getContext("step");
  $$unsubscribe_step = subscribe(step, (value) => $step = value);
  const { length } = getContext("stuff");
  if ($$props.link === void 0 && $$bindings.link && link !== void 0)
    $$bindings.link(link);
  if ($$props.text === void 0 && $$bindings.text && text !== void 0)
    $$bindings.text(text);
  $$unsubscribe_step();
  return `<a class="${[
    "bottom-10 block px-6 py-4 mt-4 leading-none rounded-lg text-xl font-serif uppercase w-auto transition hover:-translate-y-2 hover:shadow-lg hover:scale-110",
    $step != length ? "fixed" : ""
  ].join(" ").trim()}"${add_attribute("href", link, 0)} target="${"_blank"}">${escape(text)}</a>`;
});
var SekritTheater = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PopUp, "PopUp").$$render($$result, {
    link: "https://www.google.com/maps/place/Sekrit+Theater/@30.2593762,-97.6925618,15z/data=!3m1!4b1!4m5!3m4!1s0x8644b663b3275a75:0x869ce734ec83ae43!8m2!3d30.2593911!4d-97.6838521",
    text: "\u{1F5FA} Sekrit Theater \u{1F5FA}"
  }, {}, {})}`;
});
var Airbnb = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(PopUp, "PopUp").$$render($$result, {
    link: "https://www.google.com/maps/place/109+Bonnie+Dr,+Dripping+Springs,+TX+78620/@30.1946233,-98.113451,15z/data=!3m1!4b1!4m5!3m4!1s0x865b418e44e3e08d:0x39d6423e7392b0f6!8m2!3d30.194605!4d-98.1046962",
    text: "\u{1F5FA} Airbnb \u{1F5FA}"
  }, {}, {})}`;
});
var Confetti = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let canvas;
  return `<canvas class="${"absolute w-full h-full z-50 pointer-events-none"}" aria-hidden${add_attribute("this", canvas, 0)}></canvas>`;
});
var End = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<article class="${"p-4 fixed top-0 right-0 bottom-0 left-0 w-full flex justify-center items-center flex-wrap flex-col"}"><section><h1>Ceremony</h1>
		${validate_component(SekritTheater, "SekritTheater").$$render($$result, {}, {}, {})}</section>

	<section class="${"mt-14"}"><h1>Afterparty</h1>
		${validate_component(Airbnb, "Airbnb").$$render($$result, {}, {}, {})}</section></article>`;
});
var Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let activeCard;
  let mounted;
  let $step, $$unsubscribe_step;
  const match = invitation[0], lang = "english", otherLangs = ["espanol"];
  const { cards } = match;
  let step = writable(0);
  $$unsubscribe_step = subscribe(step, (value) => $step = value);
  setContext("step", step);
  const specials = new Map([
    ["confetti", Confetti],
    ["sekrit-theater", SekritTheater],
    ["airbnb", Airbnb],
    ["end", End]
  ]);
  const config = {
    delay: 600,
    length: cards.length - 1,
    cards
  };
  setContext("stuff", config);
  activeCard = cards[$step];
  mounted = false;
  $$unsubscribe_step();
  return `${$$result.head += `${$$result.title = `<title>${escape(match.title)}</title>`, ""}<meta property="${"og:url"}" content="${"https://married.sawyer.codes/invitation/" + escape(lang)}" data-svelte="svelte-1p8m2kk">`, ""}

${mounted ? `<div class="${"flex items-center justify-center h-full w-full min-h-screen text-center"}">${activeCard.special ? `${each(activeCard.special, (special) => `${validate_component(specials.get(special) || missing_component, "svelte:component").$$render($$result, {}, {}, {})}`)}` : ``}

		${validate_component(Progress, "Progress").$$render($$result, {}, {}, {})}

		${each(otherLangs, (otherLang) => `<a sveltekit:prefetch href="${"/invitation/" + escape(otherLang)}" class="${"z-50 absolute top-2 left-2 leading-none text-md font-mono transition hover:text-purple-700 hover:underline"}">${escape(otherLang)}</a>`)}

		${activeCard.text ? `<article class="${"p-4 "}">${validate_component(Typewriter, "Typewriter").$$render($$result, {
    interval: 85,
    cascade: true,
    cursor: false,
    delay: $step ? config.delay : 0
  }, {}, {
    default: () => `${each(activeCard.text, (line) => `<h1><!-- HTML_TAG_START -->${line}<!-- HTML_TAG_END --></h1>`)}`
  })}</article>` : ``}</div>

	<section class="${"absolute w-full flex justify-between bottom-2 text-4xl px-4 "}"><button${add_attribute("aria-hidden", $step === 0, 0)}${add_classes([$step === 0 ? "invisible" : ""].join(" ").trim())}>\u{1F448}</button>
		<button${add_attribute("aria-hidden", $step === config.length, 0)}${add_classes([$step === config.length ? "invisible" : ""].join(" ").trim())}>\u{1F449}</button></section>` : ``}`;
});
var index$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Routes
});
async function load({ page, fetch: fetch2 }) {
  const { lang } = page.params;
  const url = `/api/invitation/${lang}.json`;
  const res = await fetch2(url);
  if (res.ok) {
    const { match, otherLangs } = await res.json();
    return { props: { lang, match, otherLangs } };
  }
}
var U5Blangu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let activeCard;
  let mounted;
  let $step, $$unsubscribe_step;
  let { match, lang, otherLangs } = $$props;
  const { cards } = match;
  let step = writable(0);
  $$unsubscribe_step = subscribe(step, (value) => $step = value);
  setContext("step", step);
  const specials = new Map([
    ["confetti", Confetti],
    ["sekrit-theater", SekritTheater],
    ["airbnb", Airbnb],
    ["end", End]
  ]);
  const config = {
    delay: 600,
    length: cards.length - 1,
    cards
  };
  setContext("stuff", config);
  if ($$props.match === void 0 && $$bindings.match && match !== void 0)
    $$bindings.match(match);
  if ($$props.lang === void 0 && $$bindings.lang && lang !== void 0)
    $$bindings.lang(lang);
  if ($$props.otherLangs === void 0 && $$bindings.otherLangs && otherLangs !== void 0)
    $$bindings.otherLangs(otherLangs);
  activeCard = cards[$step];
  mounted = false;
  $$unsubscribe_step();
  return `${$$result.head += `${$$result.title = `<title>${escape(match.title)}</title>`, ""}<meta property="${"og:url"}" content="${"https://married.sawyer.codes/invitation/" + escape(lang)}" data-svelte="svelte-1p8m2kk">`, ""}

${mounted ? `<div class="${"flex items-center justify-center h-full w-full min-h-screen text-center"}">${activeCard.special ? `${each(activeCard.special, (special) => `${validate_component(specials.get(special) || missing_component, "svelte:component").$$render($$result, {}, {}, {})}`)}` : ``}

		${validate_component(Progress, "Progress").$$render($$result, {}, {}, {})}

		${each(otherLangs, (otherLang) => `<a sveltekit:prefetch href="${"/invitation/" + escape(otherLang)}" class="${"z-50 absolute top-2 left-2 leading-none text-md font-mono transition hover:text-purple-700 hover:underline"}">${escape(otherLang)}</a>`)}

		${activeCard.text ? `<article class="${"p-4 "}">${validate_component(Typewriter, "Typewriter").$$render($$result, {
    interval: 85,
    cascade: true,
    cursor: false,
    delay: $step ? config.delay : 0
  }, {}, {
    default: () => `${each(activeCard.text, (line) => `<h1><!-- HTML_TAG_START -->${line}<!-- HTML_TAG_END --></h1>`)}`
  })}</article>` : ``}</div>

	<section class="${"absolute w-full flex justify-between bottom-2 text-4xl px-4 "}"><button${add_attribute("aria-hidden", $step === 0, 0)}${add_classes([$step === 0 ? "invisible" : ""].join(" ").trim())}>\u{1F448}</button>
		<button${add_attribute("aria-hidden", $step === config.length, 0)}${add_classes([$step === config.length ? "invisible" : ""].join(" ").trim())}>\u{1F449}</button></section>` : ``}`;
});
var _lang_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Blangu5D,
  load
});
var Gallery = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<h1>gallery</h1>`;
});
var index = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": Gallery
});
var U5Bnameu5D = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return ``;
});
var _name_ = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": U5Bnameu5D
});

// .svelte-kit/netlify/entry.js
init();
async function handler(event) {
  const { path, httpMethod, headers, rawQuery, body, isBase64Encoded } = event;
  const query = new URLSearchParams(rawQuery);
  const encoding = isBase64Encoded ? "base64" : headers["content-encoding"] || "utf-8";
  const rawBody = typeof body === "string" ? Buffer.from(body, encoding) : body;
  const rendered = await render({
    method: httpMethod,
    headers,
    path,
    query,
    rawBody
  });
  if (rendered) {
    return {
      isBase64Encoded: false,
      statusCode: rendered.status,
      ...splitHeaders(rendered.headers),
      body: rendered.body
    };
  }
  return {
    statusCode: 404,
    body: "Not found"
  };
}
function splitHeaders(headers) {
  const h = {};
  const m = {};
  for (const key in headers) {
    const value = headers[key];
    const target = Array.isArray(value) ? m : h;
    target[key] = value;
  }
  return {
    headers: h,
    multiValueHeaders: m
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
