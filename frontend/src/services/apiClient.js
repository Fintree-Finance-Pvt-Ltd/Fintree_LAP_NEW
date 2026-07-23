import axios from "axios";
import { toast } from "react-toastify";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

/* =========================================================
   GET TOKEN FROM LOCAL STORAGE
========================================================= */

const getAccessToken = () => {
  try {
    const loginDetails = JSON.parse(
      localStorage.getItem("loginDetails") || "{}",
    );

    return (
      loginDetails?.accessToken ||
      loginDetails?.data?.accessToken ||
      localStorage.getItem("accessToken") ||
      null
    );
  } catch (error) {
    console.error("Unable to read access token:", error);

    return localStorage.getItem("accessToken");
  }
};

/* =========================================================
   REQUEST INTERCEPTOR
========================================================= */

apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-Request-ID"] =
      globalThis.crypto?.randomUUID?.() ||
      String(Date.now());

    /*
     * Remove manually assigned Content-Type for FormData.
     * Axios/browser will add the multipart boundary.
     */
    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/* =========================================================
   TOKEN REFRESH
========================================================= */

let refreshPromise = null;

const getResponseMessage = (payload, fallback) => {
  const message = payload?.message;

  if (Array.isArray(message)) {
    return message.filter(Boolean).join(", ") || fallback;
  }

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
};

const isPostRequest = (config) =>
  String(config?.method || "").toLowerCase() === "post";

apiClient.interceptors.response.use(
  (response) => {
    if (isPostRequest(response.config) && !response.config?.skipToast) {
      toast.success(
        getResponseMessage(
          response.data,
          "Login successfully.",
        ),
      );
    }

    return response.data;
  },

  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    const shouldRefresh =
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !originalRequest.url?.includes("/auth/refresh");

    if (shouldRefresh) {
      originalRequest._retry = true;

      try {
        refreshPromise ??= apiClient
          .post(
            "/auth/refresh",
            {},
            {
              skipAuthRefresh: true,
              skipToast: true,
            },
          )
          .finally(() => {
            refreshPromise = null;
          });

        const refreshedResponse = await refreshPromise;

        const newAccessToken =
          refreshedResponse?.accessToken ||
          refreshedResponse?.data?.accessToken;

        if (!newAccessToken) {
          throw new Error(
            "Access token not returned from refresh API",
          );
        }

        /*
         * Store refreshed token in localStorage.
         */
        localStorage.setItem(
          "accessToken",
          newAccessToken,
        );

        try {
          const loginDetails = JSON.parse(
            localStorage.getItem("loginDetails") || "{}",
          );

          localStorage.setItem(
            "loginDetails",
            JSON.stringify({
              ...loginDetails,
              accessToken: newAccessToken,
            }),
          );
        } catch (storageError) {
          console.error(
            "Unable to update loginDetails:",
            storageError,
          );
        }

        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("loginDetails");

        if (window.location.pathname !== "/login") {
          window.location.assign("/login");
        }

        toast.error("Session expired. Please log in again.");

        return Promise.reject({
          status: 401,
          message: "Session expired. Please log in again.",
        });
      }
    }

    const responseData = error?.response?.data;
    const message = getResponseMessage(
      responseData,
      error?.message || "Request failed",
    );

    if (isPostRequest(originalRequest) && !originalRequest?.skipToast) {
      toast.error(message);
    }

    return Promise.reject({
      success: false,
      status,
      errorCode: responseData?.errorCode,
      message,
      errors: responseData?.errors || [],
      requestId:
        responseData?.requestId ||
        responseData?.["requestId "],
    });
  },
);
