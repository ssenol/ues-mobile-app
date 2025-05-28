import { API_ENDPOINTS } from "../config/api";
import api from "./api";

class SpeechService {
  /**
   * Belirli bir task tipi için konuşma görevlerini getirir
   * @param {Object} params - Filtre parametreleri
   * @param {string} params.userId - Kullanıcı ID
   * @param {string} params.institutionId - Kurum ID
   * @param {string} params.institutionSubSchoolId - Alt Okul ID
   * @param {string} params.className - Sınıf adı
   * @param {integer} params.paginationIndex - Sayfa numarası
   * @param {string} params.activityType - Aktivite tipi ('speaking-topic' veya 'read-aloud')
   * @returns {Promise} API yanıtı
   */
  async fetchSpeechTasks(params) {
    try {
      // `params` nesnesindeki tüm anahtar-değer çiftlerini URL'ye uygun bir formatta kodlamak için `URLSearchParams` kullanılıyor.
      const urlencoded = new URLSearchParams();
      Object.keys(params).forEach((key) => {
        urlencoded.append(key, params[key]); // Her bir anahtar-değer çiftini `urlencoded` nesnesine ekler.
      });

      const response = await api.post(
        API_ENDPOINTS.quiz.fetchTasks,
        urlencoded
      );

      if (
        response.data?.status_code === 200 &&
        response.data?.success &&
        response.data?.data?.assigned_quizzez
      ) {
        // API yanıtını activityType'a göre filtreleyelim
        let filteredQuizzes = response.data.data.assigned_quizzez;

        // API yanıtında görevleri activityType'a göre filtreleme
        if (params.activityType) {
          // Görevleri filtreleme mantığı
          // "speaking-topic" için konuşma görevleri, "read-aloud" için okuma görevleri
          filteredQuizzes = filteredQuizzes.filter((quiz) => {
            // Görevin türünü belirleyelim
            const speechCards =
              quiz.question?.questionAnswersData?.speechCards || [];
            const quizType =
              speechCards.length > 0 ? speechCards[0].type_name : "";

            // Filtreleme mantığı - API'den gelen type_name değeri ile eşleştir
            const isMatchingType = quizType === params.activityType;

            return isMatchingType;
          });
        }

        return {
          quizzes: filteredQuizzes,
          totalCount: response.data.data.assigned_quizzez_total_count,
        };
      } else {
        console.error(
          "Geçersiz API yanıtı:",
          JSON.stringify(response.data, null, 2)
        );
        throw new Error("API yanıtı geçersiz format içeriyor");
      }
    } catch (error) {
      console.error(
        "Speech service error:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Kullanıcının konuşma kaydını değerlendirir.
   * @param {FormData} formData - Değerlendirme için gerekli form verileri.
   * @returns {Promise<Object>} API yanıtı.
   * @throws {Error} API çağrısı sırasında bir hata oluşursa hata fırlatır.
   */
  async evaluateSpeech(formData) {
    try {
      // Form verilerini ayarlayın
      console.log("evaluateSpeech Form data:", formData);
      const url = API_ENDPOINTS.speech.evaluation;
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "application/json",
        },
        // timeout: 60000,
      };
      const response = await api.post(url, formData, config);
      console.log("evaluateSpeech response:", response.data);

      return response.data;
    } catch (error) {
      console.error("Speech evaluation error:", error?.response?.data || error);
      console.error("Hata detayları:", JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Kullanıcının konuşma sorusuna ilişkin puanını getirir.
   * @param {Object} params - API çağrısı için gerekli parametreler.
   * @returns {Promise<Object>} API yanıtı.
   * @throws {Error} API çağrısı sırasında bir hata oluşursa hata fırlatır.
   */
  async getSpeechQuestionTopicRelatedScore(params) {
    try {
      const url = API_ENDPOINTS.speech.topicScore;
      const response = await api.post(url, params);

      return response.data;
    } catch (error) {
      console.error("Topic score error:", error?.response?.data || error);
      throw error;
    }
  }

  /**
   * Kullanıcının konuşma değerlendirme sonucunu yapay zeka ile değerlendirir.
   * @param {Object} params - API çağrısı için gerekli parametreler.
   * @param {string} params.speechData - Konuşma metni.
   * @param {Object} params.taskDetails - Görev detayları (süre, kelime sayısı, cümle sayısı).
   * @param {number} params.duration - Konuşma süresi (saniye cinsinden).
   * @param {Object} params.evaluationResult - Değerlendirme sonuçları.
   * @param {string} params.cefrLevel - CEFR seviyesi (örn: B2).
   * @param {string} params.eduLevelType - Eğitim seviyesi (örn: lise).
   * @param {string} params.speechRubricType - Konuşma değerlendirme türü (örn: ielts-general).
   * @param {number} params.topicScore - Konu puanı.
   * @param {Object} params.username - Kullanıcı bilgileri.
   * @returns {Promise<Object>} API yanıtı.
   * @throws {Error} API çağrısı sırasında bir hata oluşursa hata fırlatır.
   */
  async getSpeechAssessmentResultEvaluationByAI(params) {
    try {
      const url = API_ENDPOINTS.speech.evaluationByAI;
      const config = {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 60000,
      };
      
      // Birden fazla sonuç olduğunda ortalama değerleri hesaplamak için yardımcı fonksiyon
      const calculateAverage = (array, propertyPath) => {
        if (!array || array.length === 0) return 0;
        const sum = array.reduce((acc, item) => {
          const value = propertyPath.split('.').reduce((obj, key) => 
            obj && obj[key] !== undefined ? obj[key] : undefined, item);
          return acc + (value || 0);
        }, 0);
        return Math.round((sum / array.length) * 100) / 100; // 2 ondalık basamak
      };
      
      // İlk değeri veya varsayılan değeri döndüren yardımcı fonksiyon
      const getFirstOrDefault = (array, propertyPath, defaultValue = '') => {
        if (!array || array.length === 0) return defaultValue;
        return propertyPath.split('.').reduce((obj, key) => 
          obj && obj[key] !== undefined ? obj[key] : defaultValue, array[0]);
      };
      
      const results = params.evaluationResult?.results || [];
      
      // Ortalama skorları hesapla
      const accuracyScore = calculateAverage(results, 'NBest.0.PronunciationAssessment.AccuracyScore');
      const fluencyScore = calculateAverage(results, 'NBest.0.PronunciationAssessment.FluencyScore');
      const prosodyScore = calculateAverage(results, 'NBest.0.PronunciationAssessment.ProsodyScore');
      const completenessScore = calculateAverage(results, 'NBest.0.PronunciationAssessment.CompletenessScore');
      const pronScore = calculateAverage(results, 'NBest.0.PronunciationAssessment.PronScore');
      
      const requestBody = {
        topic_of_speech: params.speechData || "",
        reading_content_speech: "",
        system_expectations: `Expected minimum length of speech: ${ params.taskDetails?.duration || "20-40" } seconds, ${params.taskDetails?.wordCount || "50"} words, ${ params.taskDetails?.sentenceCount || "3" } sentences.`,
        speech_duration: `The speech duration is ${Math.floor(params.duration / 60)} minutes ${params.duration % 60} seconds.`,
        user_full_response: getFirstOrDefault(results, 'DisplayText', ""),
        speeched_error_content_by_words_result: "",
        mistakes_details_count: "",
        speech_results: `Accuracy Score: ${accuracyScore} Fluency Score: ${fluencyScore} Prosody Score: ${prosodyScore} Completeness Score: ${completenessScore} Pron Score: ${pronScore} All score by out of 100.`,
        cefr_level: params.cefrLevel || "B2",
        edu_level: params.eduLevelType || "high_school",
        speech_rubric_type: params.speechRubricType || "ielts-general",
        target_language: "English",
        score: {
          score: params.topicScore || 0,
        },
        user_name: params.username?.username || "student",
      };

      // console.log('AI evaluation request body:', JSON.stringify(requestBody, null, 2));

      const response = await api.post(url, requestBody, config);
      return response.data;
    } catch (error) {
      console.error("AI evaluation error:", error?.response?.data || error);
      throw error;
    }
  }
}

export default new SpeechService();
