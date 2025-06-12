import axios from "axios";
import { store } from "../store/index";
import { logout } from "../store/slices/authSlice";

// Axios instance'ı oluştur
const api = axios.create({
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  validateStatus: function (status) {
    return status >= 200 && status < 300;
  },
});

// Request interceptor - her istekte token'ı ekle (login endpointi hariç)
api.interceptors.request.use(
  async (config) => {
    // Login endpointi için token gerekmez
    const isLoginRequest = config.url && config.url.includes('/auth/mobile-app-login');
    
    const state = store.getState();
    const token = state.auth?.accessToken;

    // Login endpointi değilse ve token varsa Authorization header'ı ekle
    if (!isLoginRequest && token) {
      config.headers.Authorization = `Bearer ${token}`;

      if (config.method === "post") {
        if (config.data instanceof FormData) {
          // If data is FormData, ensure Axios sets the Content-Type.
          // Delete any pre-existing Content-Type to allow Axios to set it.
          delete config.headers["Content-Type"];
        } else if (
          config.headers["Content-Type"] &&
          config.headers["Content-Type"].includes("multipart/form-data")
        ) {
          // Data is NOT FormData, but Content-Type is multipart (odd case).
          // Leave Content-Type as is.
        } else {
          // Data is NOT FormData, and Content-Type is not (or not correctly) multipart.
          // Set to x-www-form-urlencoded and transform data if it's an object.
          config.headers["Content-Type"] = "application/x-www-form-urlencoded";
          if (
            config.data &&
            typeof config.data === "object" &&
            !(config.data instanceof URLSearchParams) // FormData case handled by the first 'if'
          ) {
            const urlencoded = new URLSearchParams();
            Object.keys(config.data).forEach((key) => {
              urlencoded.append(key, config.data[key]);
            });
            config.data = urlencoded;
          }
        }
      }
    } else if (!isLoginRequest && !token) {
      console.warn("İstek için token bulunamadı:", config.url);
    }

    return config;
  },
  (error) => {
    console.error("İstek interceptor hatası:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - hata durumlarını yönet
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error(
      `${error.config?.url || "bilinmeyen"} adresinden hata yanıtı: ${
        error.message
      }`
    );

    if (error.response?.status === 401) {
      console.error(
        "Kimlik doğrulama hatası (401):",
        error.response?.data || "Yanıt verisi yok"
      );
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

export default api;
