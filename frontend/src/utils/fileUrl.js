/**
 * Resolves any document/file path or backend URL to a fully qualified browser URL.
 * Handles:
 * - full URLs (http, https, blob, data)
 * - stale localhost URLs stored in DB or returned from backend
 * - routing through /api/uploads so Nginx reverse proxy forwards requests to backend
 */
export function getDocumentUrl(documentOrPath) {
  if (!documentOrPath) return "";

console.log("documentOrPath --> ", documentOrPath);

  const raw =
    typeof documentOrPath === "string"
      ? documentOrPath
      : documentOrPath.fileUrl ||
        documentOrPath.file_url ||
        documentOrPath.documentUrl ||
        documentOrPath.document_url ||
        documentOrPath.filePath ||
        documentOrPath.file_path ||
        documentOrPath.fileName ||
        documentOrPath.file_name ||
        documentOrPath.url ||
        "";

  if (!raw) return "";

  let str = String(raw).trim().replace(/\\/g, "/");

  const rawApiBase =
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    "";

  let apiBase = "";
  if (rawApiBase) {
    try {
      apiBase = new URL(rawApiBase, window.location.origin).href.replace(/\/+$/, "");
    } catch {
      apiBase = rawApiBase.replace(/\/+$/, "");
    }
  } else if (typeof window !== "undefined" && window.location?.origin) {
    apiBase = `${window.location.origin}/api`;
  }

  // If on a remote server and URL contains localhost:, strip the host part
  if (
    typeof window !== "undefined" &&
    window.location?.hostname !== "localhost" &&
    window.location?.hostname !== "127.0.0.1" &&
    str.includes("localhost:")
  ) {
    try {
      const parsed = new URL(str);
      str = parsed.pathname + parsed.search;
    } catch {
      // fallback
    }
  }

  // If it's a valid external URL
  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("blob:") ||
    str.startsWith("data:")
  ) {
    return str;
  }

  let cleanPath = str.replace(/^\/+/, "");

  // If path already starts with api/
  if (cleanPath.startsWith("api/")) {
    const origin = apiBase
      ? new URL(apiBase, window.location.origin).origin
      : (typeof window !== "undefined" ? window.location.origin : "");
    return `${origin}/${cleanPath}`;
  }

  // If path starts with uploads/
  if (cleanPath.startsWith("uploads/")) {
    return `${apiBase}/${cleanPath}`;
  }

  // Fallback: document file name directly under uploads/documents/
  return `${apiBase}/uploads/documents/${cleanPath}`;
}

export default getDocumentUrl;
