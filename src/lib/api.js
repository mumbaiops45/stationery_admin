/**
 * Thin fetch wrapper around the Express API.
 *
 * - The access token lives in memory only (never localStorage), so an XSS bug
 *   cannot read it back later. It is restored on reload from the httpOnly
 *   refresh cookie the API sets at /api/auth.
 * - A 401 triggers one refresh attempt, then the original request is replayed.
 *   Concurrent 401s share a single refresh call.
 */

const BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

let accessToken = null;
let refreshPromise = null;
let onSessionExpired = null;

export function setAccessToken(token) {
  accessToken = token || null;
}

export function getAccessToken() {
  return accessToken;
}

/** The auth store registers here so a dead session can clear itself. */
export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler;
}

function toQuery(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function readBody(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // Express answers an unmatched route with a full HTML error page. Putting
    // that markup in an alert tells the reader nothing the status line does
    // not, so drop it and let the caller build the message from the status.
    if (/^\s*<(!doctype|html)/i.test(text)) return null;
    return { message: text.slice(0, 300) };
  }
}

async function send(path, { method, body, params, headers, signal, auth }) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  try {
    return await fetch(`${BASE_URL}${path}${toQuery(params)}`, {
      method,
      signal,
      // sends and receives the httpOnly refresh cookie
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : body ? { "Content-Type": "application/json" } : {}),
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;

    // fetch only rejects when the request never completed: the server is
    // unreachable, or the browser blocked the response over CORS. The API
    // must allow this exact origin *with credentials*.
    const origin =
      typeof window === "undefined" ? "this app" : window.location.origin;

    throw new ApiError(
      `Could not reach ${BASE_URL}. Either the API is down, or it is not allowing requests from ${origin} (CORS).`,
      0,
      null,
    );
  }
}

/** POST /auth/refresh — de-duplicated so parallel 401s only refresh once. */
export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await send("/auth/refresh", {
        method: "POST",
        auth: false,
      });
      const payload = await readBody(response);

      if (!response.ok || !payload?.success) {
        accessToken = null;
        throw new ApiError(
          payload?.message || "Your session has expired",
          response.status,
          payload,
        );
      }

      accessToken = payload?.data?.accessToken || null;
      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function request(path, options = {}) {
  const {
    method = "GET",
    body,
    params,
    headers,
    signal,
    auth = true,
    // /auth/login and /auth/refresh must never trigger a refresh-retry loop
    retryOnUnauthorized = true,
  } = options;

  let response = await send(path, { method, body, params, headers, signal, auth });

  if (response.status === 401 && auth && retryOnUnauthorized) {
    try {
      await refreshAccessToken();
      response = await send(path, { method, body, params, headers, signal, auth });
    } catch (error) {
      onSessionExpired?.();
      throw error;
    }
  }

  const payload = await readBody(response);

  if (!response.ok || payload?.success === false) {
    if (response.status === 401) onSessionExpired?.();
    throw new ApiError(
      payload?.message || `${method} ${path} failed (${response.status})`,
      response.status,
      payload,
    );
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

/**
 * A GET whose mount path is not knowable from this repo.
 *
 * Several admin routers only answer "/" and are mounted somewhere the client
 * cannot see. Given a list of candidates, this tries each in turn, remembers
 * the first that is not a 404, and uses only that one afterwards. Anything
 * other than a 404 — auth, network, a 500 from the controller — is a real
 * failure and is rethrown rather than masked by trying the next candidate.
 */
export function createEndpointResolver(candidates) {
  let resolved = null;

  return {
    /** The path that answered, or the first guess — useful in an error. */
    path: () => resolved || candidates[0],

    get: async (options) => {
      const paths = resolved ? [resolved] : candidates;
      let lastError = null;

      for (const path of paths) {
        try {
          const payload = await api.get(path, options);
          resolved = path;
          return payload;
        } catch (error) {
          // An abort is the caller unmounting, not a wrong path.
          if (error?.name === "AbortError") throw error;
          if (error?.status !== 404) throw error;
          lastError = error;
        }
      }

      // Every candidate answered "no such route" — the mount is elsewhere.
      throw new ApiError(
        `None of these paths exist on the API: ${candidates.join(", ")}. Check where this router is mounted and set the matching NEXT_PUBLIC_*_PATH.`,
        404,
        lastError?.data ?? null,
      );
    },
  };
}

/**
 * Flattens the API list envelope into one shape the list hooks can rely on.
 *
 * Products answer with { data: { products, pagination: { page, limit,
 * totalProducts, totalPages } } }, categories with the same envelope but a
 * totalCategories key, and the public category route with no pagination at
 * all — { data: { categories } }.
 */
export function normalizeList(payload, key) {
  const data = payload?.data ?? payload;

  const found = Array.isArray(data)
    ? data
    : data?.[key] || data?.items || data?.docs || data?.results;

  const items = Array.isArray(found) ? found : [];
  const meta = data?.pagination || data?.meta || {};

  const limit = Number(meta.limit) || items.length || 10;

  // Every admin list names its own count after the resource — totalProducts,
  // totalCategories, totalOrders — so take the first total* key that is not
  // totalPages rather than listing them one by one.
  const totalKey = Object.keys(meta).find(
    (key) => key !== "totalPages" && key.startsWith("total"),
  );

  const total = Number(
    meta[totalKey] ?? meta.total ?? meta.totalDocs ?? items.length,
  );
  const pages =
    Number(meta.totalPages ?? meta.pages) || Math.max(Math.ceil(total / limit), 1);

  return {
    items,
    total,
    page: Number(meta.page) || 1,
    limit,
    pages,
  };
}
