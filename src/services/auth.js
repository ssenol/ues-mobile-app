import api from "./api";
import { API_ENDPOINTS } from "../config/api";

class AuthService {
  async login(username, password) {
    try {
      const response = await api.post(API_ENDPOINTS.auth.login, {
        username,
        password,
      });

      // API yanıtını doğru şekilde işleyelim
      // console.log("Ham giriş yanıtı:", JSON.stringify(response.data, null, 2));
      
      if (response.data?.status === "success" && response.data?.data) {
        // refresh_token, user object'i içerisinde yer alıyor. Ayrıca tanımlamaya gerek yok.
        const token = response.data.data.token;
        const user = response.data.data.user;
        
        if (!token) {
          console.error("Giriş yanıtında token bulunamadı:", JSON.stringify(response.data, null, 2));
          throw new Error("Giriş yanıtında token bulunamadı");
        }
        
        // console.log("Çıkarılan token:", token.substring(0, 15) + "...");
        // console.log("Çıkarılan kullanıcı bilgisi:", JSON.stringify(user, null, 2));
        
        return {
          token: token,
          user: user,
        };
      } else {
        // console.error("Geçersiz giriş yanıt formatı:", JSON.stringify(response.data, null, 2));
        throw new Error("Geçersiz giriş yanıt formatı");
      }
    } catch (error) {
      console.error('Giriş hatası:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data,
        isAxiosError: error.isAxiosError,
      });
      throw error;
    }
  }

  async refreshToken(refreshToken) {
    try {
      const response = await api.post(API_ENDPOINTS.auth.refresh, {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      console.error('Token yenileme hatası:', error?.response?.data || error);
      throw error;
    }
  }

  async logout(refreshToken) {
    try {
      const response = await api.post(API_ENDPOINTS.auth.logout, {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      console.error('Çıkış hatası:', error?.response?.data || error);
      throw error;
    }
  }
}

export default new AuthService();
