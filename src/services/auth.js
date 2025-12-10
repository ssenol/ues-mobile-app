import api, { API_ENDPOINTS } from "../config/api";

class AuthService {
  async login(username, password) {
    try {
      const response = await api.post(API_ENDPOINTS.auth.login, {
        username,
        password,
      });

      if (response.data?.status === "success" && response.data?.data) {
        // refresh_token, user object'i içerisinde yer alıyor. Ayrıca tanımlamaya gerek yok.
        const { token, user, refreshToken } = response.data.data;
        
        if (!token) {
          console.error("Giriş yanıtında token bulunamadı:", JSON.stringify(response.data, null, 2));
          throw new Error("Giriş yanıtında token bulunamadı");
        }
        
        return {
          token,
          user,
          refreshToken,
        };
      } else {
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

      if (response.data?.status === "success" && response.data?.data) {
        const token = response.data.data.token;
        const user = response.data.data.user;
        
        if (!token) {
          console.error("Token yenileme yanıtında token bulunamadı:", JSON.stringify(response.data, null, 2));
          throw new Error("Token yenileme yanıtında token bulunamadı");
        }
        
        return {
          token: token,
          user: user,
        };
      } else {
        throw new Error("Geçersiz token yenileme yanıt formatı");
      }
    } catch (error) {
      console.error('Token yenileme hatası:', error?.response?.data || error);
      throw error;
    }
  }

  // async logout(refreshToken) {
  //   try {
  //     const response = await api.post(API_ENDPOINTS.auth.logout, {
  //       refreshToken,
  //     });
  //     return response.data;
  //   } catch (error) {
  //     console.error('Çıkış hatası:', error?.response?.data || error);
  //     throw error;
  //   }
  // }
}

export default new AuthService();
