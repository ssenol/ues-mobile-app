import { isAxiosError } from "axios";
import api, { API_ENDPOINTS } from "../config/api";
import type { ApiResponse, AuthUser } from "../types/api";

interface LoginResponseData {
  token?: string;
  user?: AuthUser;
  refreshToken?: string;
}

export interface LoginResult {
  token: string;
  user?: AuthUser;
  refreshToken?: string;
}

// Uygulama yalnızca öğrenciler içindir; öğretmen/yönetici hesapları girişte reddedilir
export class NotStudentError extends Error {
  constructor() {
    super("Only student accounts can sign in.");
    this.name = "NotStudentError";
  }
}

export interface RefreshResult {
  token: string;
  user?: AuthUser;
}

class AuthService {
  async login(username: string, password: string): Promise<LoginResult> {
    return this.requestLogin(API_ENDPOINTS.auth.login, { username, password });
  }

  // Web'den (service.ueslms) deep link ile gelen şifreli SSO token'ını quizmaker-api'de oturuma çevirir.
  // Yanıt /auth/login ile aynı şekildedir; öğrenci kontrolü de aynen uygulanır.
  async loginWithSsoToken(ssoToken: string): Promise<LoginResult> {
    return this.requestLogin(API_ENDPOINTS.auth.ssoMobile, { token: ssoToken });
  }

  // /auth/login ve /auth/sso-mobile ortak yanıtı: { user, token, refreshToken }
  private async requestLogin(url: string, body: Record<string, string>): Promise<LoginResult> {
    try {
      const response = await api.post<ApiResponse<LoginResponseData>>(url, body, {
        // Açık bir oturum varken (SSO ile kullanıcı değişimi) mevcut access token eklenmesin
        skipAuthInterceptor: true,
      });

      if (response.data?.status === "success" && response.data?.data) {
        // refresh_token, user object'i içerisinde yer alıyor. Ayrıca tanımlamaya gerek yok.
        const { token, user, refreshToken } = response.data.data;
        
        if (!token) {
          console.error("Giriş yanıtında token bulunamadı:", JSON.stringify(response.data, null, 2));
          throw new Error("Giriş yanıtında token bulunamadı");
        }

        if (user?.role !== "student") {
          throw new NotStudentError();
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
      if (error instanceof NotStudentError) {
        throw error;
      }
      if (isAxiosError(error)) {
        // error.config loglanmaz: istek gövdesi şifreyi / SSO token'ını içerir
        console.error('Giriş hatası:', {
          message: error.message,
          code: error.code,
          status: error.response?.status,
          response: error.response?.data,
          isAxiosError: true,
        });
      } else {
        console.error('Giriş hatası:', { message: (error as Error)?.message, isAxiosError: false });
      }
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    try {
      const response = await api.post<ApiResponse<LoginResponseData>>(API_ENDPOINTS.auth.refresh, {
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
      // AxiosError'un tamamı loglanmaz: config içindeki istek gövdesi refreshToken'ı taşır
      console.error(
        'Token yenileme hatası:',
        isAxiosError(error)
          ? { message: error.message, status: error.response?.status, response: error.response?.data }
          : (error as Error)?.message
      );
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
