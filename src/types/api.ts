// Backend (quizmaker-api) ile paylaşılan ortak tipler.
// Endpoint'lerin tamamının şeması henüz tiplenmedi; bilinmeyen alanlar esnek bırakıldı.

// Backend'in çoğu endpoint'te döndüğü sarmalayıcı yanıt
export interface ApiResponse<T = unknown> {
  status?: string;
  success?: boolean;
  status_code?: number;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

// Oturum açan kullanıcı; alanlar kurumsal sistemden geldiği için tamamı opsiyonel
export interface AuthUser {
  id?: string;
  _id?: string;
  userId?: string;
  username?: string;
  name?: string;
  avatarUrl?: string;
  classInfo?: string[];
  [key: string]: unknown;
}
