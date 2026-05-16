/**
 * Hermes / RN TextDecoder often rejects 'latin1' (used by fast-png for PNG tEXt chunks).
 * Must load before any module that does `new TextDecoder('latin1')` at import time.
 */
function installLatin1TextDecoder() {
  const Native = globalThis.TextDecoder;
  if (typeof Native !== 'function') return;

  function isLatin1Label(encoding) {
    if (encoding == null || encoding === '') return false;
    const enc = String(encoding).toLowerCase();
    return (
      enc === 'latin1' ||
      enc === 'iso-8859-1' ||
      enc === 'iso8859-1' ||
      enc === 'windows-1252' ||
      enc === 'cp1252'
    );
  }

  function Latin1Decoder() {}

  Latin1Decoder.prototype.decode = function decode(input, options) {
    if (input == null || input.byteLength === 0) return '';
    let u8;
    if (input instanceof Uint8Array) {
      u8 = input;
    } else if (input instanceof ArrayBuffer) {
      u8 = new Uint8Array(input);
    } else if (ArrayBuffer.isView(input)) {
      u8 = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    } else {
      return '';
    }
    let out = '';
    const step = 16384;
    for (let i = 0; i < u8.length; i += step) {
      const end = Math.min(i + step, u8.length);
      let chunk = '';
      for (let j = i; j < end; j++) chunk += String.fromCharCode(u8[j]);
      out += chunk;
    }
    return out;
  };

  function WrappedTextDecoder(encoding, options) {
    if (isLatin1Label(encoding)) {
      return new Latin1Decoder();
    }
    return new Native(encoding, options);
  }

  WrappedTextDecoder.prototype = Native.prototype;
  Object.defineProperty(WrappedTextDecoder, 'name', { value: 'TextDecoder' });

  globalThis.TextDecoder = WrappedTextDecoder;
}

installLatin1TextDecoder();
