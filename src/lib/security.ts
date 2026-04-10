export const MAX_MESSAGE_LENGTH = 8_000;
export const MAX_MODEL_ID_LENGTH = 80;
export const MAX_COMPLETION_REQUEST_BYTES = 32 * 1024;

export const MAX_TEXT_UPLOAD_BYTES = 1_000_000;
export const MAX_IMAGE_UPLOAD_BYTES = 4_000_000;
export const MAX_UPLOAD_REQUEST_BYTES = MAX_IMAGE_UPLOAD_BYTES + 256 * 1024;
export const MAX_DOCUMENT_CHARACTERS = 100_000;
export const MAX_DOCUMENT_NAME_LENGTH = 120;
export const MAX_RAG_CHUNKS = 40;

const DATA_URL_BASE64_MARKER = ";base64,";

export function isContentLengthOverLimit(
  headerValue: string | null,
  maxBytes: number
) {
  if (!headerValue) return false;

  const parsed = Number(headerValue);
  return Number.isFinite(parsed) && parsed > maxBytes;
}

export function getDataUrlPayloadBytes(value: string) {
  const markerIndex = value.indexOf(DATA_URL_BASE64_MARKER);
  if (markerIndex === -1) return 0;

  const payload = value.slice(markerIndex + DATA_URL_BASE64_MARKER.length);
  const paddingLength = payload.endsWith("==")
    ? 2
    : payload.endsWith("=")
      ? 1
      : 0;

  return Math.max(0, Math.floor((payload.length * 3) / 4) - paddingLength);
}

export function getSafeRedirectPath(next: string | null) {
  if (!next) return "/";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }

  try {
    const url = new URL(next, "https://example.com");
    if (url.origin !== "https://example.com") {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
