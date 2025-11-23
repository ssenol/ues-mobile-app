import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { store } from "../store/index";
import { logout, setCredentials, updateToken } from "../store/slices/authSlice";

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
    // Login ve refresh endpointleri için token gerekmez
    const isLoginRequest = config.url && config.url.includes('/auth/login');
    const isRefreshRequest = config.url && config.url.includes('/auth/refresh');
    
    const state = store.getState();
    let token = state.auth?.accessToken;
    const refreshToken = state.auth?.refreshToken;
    const tokenAcquiredAt = state.auth?.tokenAcquiredAt;

    // Login ve refresh endpointleri değilse token kontrolü yap
    if (!isLoginRequest && !isRefreshRequest && token) {
      // 24 saat (86400000 ms) geçmişse token'ı yenile
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (tokenAcquiredAt && (now - tokenAcquiredAt) > twentyFourHours) {
        if (refreshToken) {
          try {
            // Refresh token endpoint'ine direkt axios ile istek at (circular dependency'yi önlemek için)
            const refreshResponse = await axios.post(API_ENDPOINTS.auth.refresh, {
              refreshToken,
            }, {
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (refreshResponse.data?.status === "success" && refreshResponse.data?.data) {
              const newToken = refreshResponse.data.data.token;
              const newUser = refreshResponse.data.data.user;
              
              if (newToken) {
                token = newToken;
                store.dispatch(updateToken({ token }));
                // Eğer user bilgisi de geliyorsa güncelle
                if (newUser) {
                  store.dispatch(setCredentials({
                    token: newToken,
                    user: newUser,
                    tokenAcquiredAt: Date.now(),
                  }));
                }
              }
            }
          } catch (refreshError) {
            console.error('Token yenileme başarısız:', refreshError);
            // Token yenileme başarısız oldu, logout yap
            store.dispatch(logout());
            return Promise.reject(new Error('Token yenileme başarısız'));
          }
        } else {
          console.warn('Refresh token bulunamadı, logout yapılıyor');
          store.dispatch(logout());
          return Promise.reject(new Error('Refresh token bulunamadı'));
        }
      }

      // Token varsa Authorization header'ı ekle
      config.headers.Authorization = `Bearer ${token}`;

      // JSON endpoint'leri için Content-Type'ı değiştirme
      const isJsonEndpoint = config.url && (
        config.url.includes('/student/get-assigned-speech-tasks') ||
        config.url.includes('/auth/refresh')
      );

      if (config.method === "post" && !isJsonEndpoint) {
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
      } else if (config.method === "post" && isJsonEndpoint) {
        // JSON endpoint'leri için Content-Type'ı JSON olarak ayarla
        config.headers["Content-Type"] = "application/json";
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

    // 401 hatası alındığında token yenileme dene
    if (error.response?.status === 401) {
      const originalRequest = error.config;
      
      // Eğer bu bir refresh token isteği ise veya zaten retry edilmişse logout yap
      const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');
      const isRetry = originalRequest._retry;
      
      if (isRefreshRequest || isRetry) {
        console.error(
          "Token yenileme başarısız veya zaten retry edilmiş, logout yapılıyor:",
          error.response?.data || "Yanıt verisi yok"
        );
        store.dispatch(logout());
        return Promise.reject(error);
      }

      // İlk 401 hatası, token yenileme dene
      const state = store.getState();
      const refreshToken = state.auth?.refreshToken;
      
      if (refreshToken) {
        try {
          originalRequest._retry = true;
          
          // Refresh token endpoint'ine direkt axios ile istek at (circular dependency'yi önlemek için)
          const refreshResponse = await axios.post(API_ENDPOINTS.auth.refresh, {
            refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (refreshResponse.data?.status === "success" && refreshResponse.data?.data) {
            const newToken = refreshResponse.data.data.token;
            const newUser = refreshResponse.data.data.user;
            
            if (newToken) {
              // Yeni token ile orijinal isteği tekrar dene
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              store.dispatch(updateToken({ token: newToken }));
              
              // Eğer user bilgisi de geliyorsa güncelle
              if (newUser) {
                store.dispatch(setCredentials({
                  token: newToken,
                  user: newUser,
                  tokenAcquiredAt: Date.now(),
                }));
              }
              
              return api(originalRequest);
            }
          }
        } catch (refreshError) {
          console.error('401 hatası sonrası token yenileme başarısız:', refreshError);
          store.dispatch(logout());
          return Promise.reject(refreshError);
        }
      } else {
        console.error(
          "401 hatası ve refresh token bulunamadı, logout yapılıyor:",
          error.response?.data || "Yanıt verisi yok"
        );
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default api;
