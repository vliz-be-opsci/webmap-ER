import { AppState } from './store';

export async function encodeStateToFragment(state: AppState): Promise<string> {
  const json = JSON.stringify(state);
  const encoder = new TextEncoder();
  const data = encoder.encode(json);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      await writer.write(data);
      await writer.close();
      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const base64 = bufferToBase64Url(new Uint8Array(compressedBuffer));
      return `#gz=${base64}`;
    } catch {}
  }
  return `#raw=${bufferToBase64Url(data)}`;
}

export async function decodeStateFromFragment(hash: string): Promise<AppState | null> {
  if (!hash || !hash.includes('=')) return null;
  const [prefix, payload] = hash.replace(/^#/, '').split('=');
  if (!payload) return null;

  try {
    const bytes = base64UrlToBuffer(payload);
    if (prefix === 'gz' && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      const writer = ds.writable.getWriter();
      await writer.write(bytes);
      await writer.close();
      const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
      const json = new TextDecoder().decode(decompressedBuffer);
      return JSON.parse(json);
    } else {
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    }
  } catch (err) {
    console.warn('Failed to decompress URI fragment state', err);
    return null;
  }
}

function bufferToBase64Url(uint8: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8.byteLength; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
