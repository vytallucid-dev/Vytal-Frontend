/**
 * Thin typed fetch wrapper for the InvestIQ API.
 * Base URL is set via NEXT_PUBLIC_API_BASE_URL (required in production).
 * All helpers throw ApiError on non-2xx so React Query's error state works.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "message" in err
  );
}

export { isApiError };

class HttpError extends Error {
  constructor(public readonly apiError: ApiError) {
    super(apiError.message);
    this.name = "HttpError";
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const apiError: ApiError = {
      status: res.status,
      message: isJson
        ? ((body as { detail?: string; message?: string }).detail ??
          (body as { detail?: string; message?: string }).message ??
          res.statusText)
        : res.statusText,
      detail: isJson ? body : undefined,
    };
    throw new HttpError(apiError);
  }

  return body as T;
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });
  return parseResponse<T>(res);
}
