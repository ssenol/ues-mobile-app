import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/Icon";
import speechService from "../services/speech";
import { selectCurrentUser } from "../store/slices/authSlice";
import { setSpeechResults } from "../store/slices/speechSlice";
import colors from "../styles/colors";
import { cleanHtmlAndBreaks } from "../utils/helpers";

const SpeechRecordScreen = ({ route, navigation }) => {
  const {
    taskId,
    questionId,
    quizName,
    speechData,
    taskDetails,
    taskType,
    questionSubDetails,
  } = route.params;

  // Aktif ses kaydı nesnesini tutar (expo-av Recording nesnesi)
  const [recording, setRecording] = useState(null);

  // Kaydedilen sesi oynatmak için kullanılan ses nesnesi (expo-av Sound nesnesi)
  const [sound, setSound] = useState(null);

  // Kaydedilen ses dosyasının URI'sini tutar
  const [recordedUri, setRecordedUri] = useState(null);

  // Ses kaydının devam edip etmediğini kontrol eder
  const [isRecording, setIsRecording] = useState(false);

  // Kaydedilen sesin oynatılıp oynatılmadığını kontrol eder
  const [isPlaying, setIsPlaying] = useState(false);

  // API istekleri sırasındaki yükleme durumunu kontrol eder
  const [isLoading, setIsLoading] = useState(false);

  // Ses kaydının süresini saniye cinsinden tutar
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Hata mesajlarını tutar
  const [error, setError] = useState(null);

  // Ses kaydının gönderilmeye hazır olup olmadığını kontrol eder
  const [pendingSubmit, setPendingSubmit] = useState(false);

  // Redux'tan kullanıcı bilgisini alır
  const username = useSelector(selectCurrentUser);

  // Redux action'larını tetiklemek için kullanılır
  const dispatch = useDispatch();

  useEffect(() => {
    // Komponent unmount olduğunda çalışacak cleanup fonksiyonu
    return () => {
      // Eğer aktif bir kayıt varsa durdur
      if (recording) {
        stopRecording();
      }
      // Eğer aktif bir ses çalma işlemi varsa durdur ve sound nesnesini temizle
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    };
  }, []);

  useEffect(() => {
    return navigation.addListener("beforeRemove", (e) => {
      // Ekrandan çıkmadan önce ses kaydının devam edip etmediğini kontrol et
      if (isRecording) {
        // Varsayılan çıkış işlemini engelle
        e.preventDefault();
        // Ses kaydını durdur
        stopRecording();
        // Çıkış işlemini gerçekleştir
        navigation.dispatch(e.data.action);
      }
    });
  }, [navigation, isRecording]);

  useEffect(() => {
    // Uygulama başladığında ses yapılandırmasını ayarlar
    const configureAudio = async () => {
      try {
        // Audio modunu ayarla
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true, // iOS'ta ses kaydına izin ver
          playsInSilentModeIOS: true, // iOS'ta sessiz modda çalmaya izin ver  
          staysActiveInBackground: true, // Arka planda aktif kalmasını sağla
          shouldDuckAndroid: false, // Android'de diğer ses kaynaklarını kısma
          playThroughEarpieceAndroid: false, // Android'de hoparlörden çal
        });
      } catch (err) {
        console.error("Error configuring audio:", err);
      }
    };

    configureAudio();
  }, []);

  // Kaydedilen ses dosyasının URI'si değiştiğinde herhangi bir işlem yapılmıyor
  useEffect(() => {}, [recordedUri]);

  // Kaydedilen ses dosyasının URI'si ve gönderim isteği durumu değiştiğinde çalışır
  // Eğer gönderim isteği varsa ve URI mevcutsa:
  // 1. Gönderim isteği false yapılır
  // 2. handleSubmit fonksiyonu çağrılarak ses dosyası sunucuya gönderilir
  useEffect(() => {
    if (pendingSubmit && recordedUri) {
      setPendingSubmit(false);
      handleSubmit();
    }
  }, [recordedUri, pendingSubmit]);

  const startRecording = async () => {
    try {
      // Ses kaydı için gerekli izinleri iste
      await Audio.requestPermissionsAsync();

      // Ses modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true, // iOS'ta kayıt yapılmasına izin ver
        playsInSilentModeIOS: true, // iOS'ta sessiz modda çalışmaya izin ver
        staysActiveInBackground: true, // Arka planda aktif kal
        shouldDuckAndroid: false, // Android'de diğer sesleri kısma 
        playThroughEarpieceAndroid: false, // Android'de hoparlörden çal
      });

      // Kayıt seçeneklerini belirle
      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100, // Örnekleme hızı
          numberOfChannels: 1, // Mono ses
          bitRate: 128000, // Bit hızı
        },
        ios: {
          extension: ".m4a",
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
        },
      };

      // Ses kaydını başlat
      const {recording} = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);

      // Kayıt süresini sayan sayacı başlat
      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Kayıt durumu değiştiğinde kontrol et
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          clearInterval(interval); // Kayıt durduğunda sayacı durdur
        }
      });
    } catch (err) {
      // Hata durumunda konsola ve kullanıcıya bildir
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    // Eğer aktif bir kayıt yoksa fonksiyondan çık
    if (!recording) return;

    try {
      // Kaydı durdur ve kaynakları serbest bırak
      await recording.stopAndUnloadAsync();
      // Kaydedilen dosyanın URI'sini al
      const uri = recording.getURI();

      // URI alınamadıysa hata fırlat
      if (!uri) {
        throw new Error("Ses kaydı URI alınamadı");
      }

      // Kullanıcıya kaydı göndermek isteyip istemediğini sor
      Alert.alert("Record", "Do you want to send the audio recording?", [
        {
          text: "No",
          style: "cancel",
          onPress: () => {
            // Hayır seçeneğinde sadece URI'yi kaydet
            setRecordedUri(uri);
          },
        },
        {
          text: "Yes",
          onPress: () => {
            // Evet seçeneğinde gönderim için hazırla ve URI'yi kaydet
            setPendingSubmit(true);
            setRecordedUri(uri);
          },
        },
      ]);

      // Kayıt nesnesini ve kayıt durumunu temizle
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      // Hata durumunda konsola log yaz ve kullanıcıyı bilgilendir
      console.error("Error stopping recording:", err);
      Alert.alert("Error", "Recording could not be stopped");
      setRecordedUri(null);
    }
  };

  const playSound = async () => {
    try {
      // Eğer ses zaten çalınıyorsa ses çalmayı durdur ve kaynakları temizle
      if (isPlaying) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setIsPlaying(false);
        return;
      }

      // Yeni bir ses nesnesi oluştur ve ayarlarını yap
      const {sound: newSound} = await Audio.Sound.createAsync(
        {uri: recordedUri},
        {
          shouldPlay: true, // Ses yüklenince otomatik çal
          volume: 1.0, // Tam ses seviyesi
          isMuted: false, // Sessiz mod kapalı
          isLooping: false, // Tekrar etme kapalı
          progressUpdateIntervalMillis: 100, // İlerleme güncelleme aralığı
        },
        null,
        true
      );

      // iOS'a özel ses ayarlarını yap
      if (Platform.OS === "ios") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false, // iOS'ta kayıt yapılmasını engelle
          playsInSilentModeIOS: true, // Sessiz modda çalmaya izin ver
          staysActiveInBackground: true, // Arka planda çalmaya devam et
          shouldDuckAndroid: false, // Android'de diğer sesleri kısma
          playThroughEarpieceAndroid: false, // Android'de hoparlörden çal
        });
      }

      // Oluşturulan ses nesnesini state'e kaydet ve çalmayı başlat
      setSound(newSound);
      setIsPlaying(true);

      // Ses çalma durumundaki değişiklikleri takip et
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      // Hata durumunda konsola log yaz ve kullanıcıyı bilgilendir
      console.error("Error playing sound:", err);
      setIsPlaying(false);
      if (sound) {
        await sound.unloadAsync();
          setSound(null);
        }
        Alert.alert("Error", "Failed to playback recording");
      }
    };

  // Verilen saniye değerini "dakika:saniye" formatına dönüştüren fonksiyon
  // Örnek: 125 saniye -> "2:05"
  const formatDuration = (seconds) => {
    // console.log("formatDuration seconds:", seconds);
    // Toplam dakikayı bul (saniyeyi 60'a böl ve aşağı yuvarla)
    const mins = Math.floor(seconds / 60);
    // Kalan saniyeleri bul (60'a bölümünden kalan)  
    const secs = seconds % 60;
    // Dakika ve saniyeyi birleştir, saniyeyi 2 basamaklı olacak şekilde sol tarafa 0 ekle
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    // Check if recordedUri is available
    if (!recordedUri) {
      Alert.alert('Uyarı', 'Ses kaydı bulunamadı. Lütfen tekrar kayıt yapmayı deneyin.');
      setIsLoading(false);
      setError('Ses kaydı URI mevcut değil.'); // Set an error state for more detailed debugging if needed
      return;
    }
    try {
      // Gerekli parametreleri hazırla
      const uesId = username?.id;
      const audioFile = Platform.OS === 'ios' ? recordedUri : recordedUri?.replace('file://', '');
      // Robust check for audioFile validity
      // if (typeof audioFile !== 'string' || audioFile.trim() === '') {
        // console.error('handleSubmit Error: audioFile is invalid. Value:', audioFile, 'Original recordedUri:', recordedUri);
        // Alert.alert('Hata', 'Geçersiz ses dosyası referansı. Lütfen ses kaydını kontrol edip tekrar deneyin.');
        // setIsLoading(false);
        // setError('Geçersiz ses dosyası referansı.');
        // return;
      // }
      const stage = __DEV__ ? 'test' : 'prod';
      const fullName = username?.name + ' ' + username?.surname;
      const speechDuration = recordingDuration || 0;

      const paramsForAPI = {
        assignedTaskId: taskId,
        speechTaskId: questionId,
        uesId,
        audioFile,
        stage,
        username: fullName,
        speechDuration,
      };
      console.log("[SpeechRecordScreen.js] handleSubmit - Parameters being sent to API:", paramsForAPI);

      // Yeni API çağrısı
      const response = await speechService.evaluateSpeechMobileTask(paramsForAPI);
      console.log("[SpeechRecordScreen.js] handleSubmit - Speech evaluation response:", response);

      if (response?.status_code !== 200) {
        throw new Error('Speech evaluation failedxx');
      }
      // Redux ile sonucu kaydet
      dispatch(setSpeechResults({ speechResults: response.data }));
      // Rapor ekranına yönlendir
      navigation.navigate('SpeechReport', {
        taskId,
        speechResults: response.data,
        quizName,
        speechData,
        taskDetails,
        taskType,
        questionSubDetails
      });
    } catch (error) {
      // if (error.isAxiosError) {
      //   console.error('Speech evaluation Axios error details:', error.toJSON());
      //   console.error('Speech evaluation Axios error request:', error.request);
      //   console.error('Speech evaluation Axios error response:', error.response);
      // } else {
      //   console.error('Speech evaluation generic error:', error);
      // }
      // Alert.alert('Error', 'There was an error when evaluating the speech. Check console for details.');
      setError(error.message);
      // For more user-friendly error, consider parsing error.response.data if available
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
        Alert.alert('Error', error.response.data.message);
      } else if (error.request) {
        setError('Network error: No response received from server.');
        Alert.alert('Error', 'Network error: No response received from server.');
      } else {
        setError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.taskDescription}>
        {taskType === "speaking-topic"
          ? "Speak and record the following topic in the time, words and sentences given below."
          : "Read the following text aloud and record it."}
      </Text>
      <View style={styles.taskContainer}>
        {taskType === "read-aloud" ? (
          <ScrollView style={styles.scrollTextContainer}>
            <Text style={styles.speechText}>{cleanHtmlAndBreaks(speechData)}</Text>
          </ScrollView>
        ) : (
          <Text style={styles.speechText}>{cleanHtmlAndBreaks(speechData)}</Text>
        )}
      </View>

      <View style={styles.recordContainer}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Evaluation is starting...</Text>
          </View>
        ) : (
          <View style={styles.recordButtonWrapper}>
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton,
                (isLoading || isPlaying) && styles.disabledButton,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={isLoading || isPlaying}
            >
              <Icon
                iosName={isRecording ? "stop.fill" : "mic.fill"}
                androidName={isRecording ? "stop" : "mic"}
                size={90}
                color={isLoading || isPlaying ? colors.slate400 : colors.white}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.recordText,
                (isLoading || isPlaying) && styles.disabledText,
              ]}
            >
              {isRecording
                ? "Click to stop recording"
                : "Click to start recording"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.playButtonContainer}>
        {isRecording ? (
          <Text style={styles.recordDuration}>
            {formatDuration(recordingDuration)}
          </Text>
        ) : recordedUri && !isRecording ? (
          <View
            style={[
              styles.actionButtons,
              isLoading && styles.disabledContainer,
            ]}
          >
            <TouchableOpacity
              style={[styles.playButton, isLoading && styles.disabledButton]}
              onPress={playSound}
              disabled={isLoading}
            >
              <Icon
                iosName={isPlaying ? "stop.fill" : "play.fill"}
                androidName={isPlaying ? "stop" : "play-arrow"}
                size={24}
                color={isLoading ? colors.slate400 : colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Icon
                iosName="paperplane"
                androidName="send"
                size={24}
                color={isLoading ? colors.slate400 : colors.white}
              />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {taskType === "speaking-topic" && taskDetails && (
        <View style={styles.recordInfoContainer}>
          <Text style={styles.recordInfoText}>
            <Text style={styles.recordInfoBold}>
              * Suggested speech details:{"\n"}
            </Text>
            <Text>
              {taskDetails.duration} seconds, {taskDetails.wordCount} words,{" "}
              {taskDetails.sentenceCount} sentences.
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  taskDescription: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 20,
  },
  taskContainer: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderColor: colors.primary,
    borderWidth: 1,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  speechText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 22,
    textAlign: "left",
    paddingHorizontal: 8,
  },
  scrollTextContainer: {
    maxHeight: 210,
    width: "100%",
  },
  recordContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButtonWrapper: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
  },
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 10,
    borderColor: colors.secondary,
  },
  recordingButton: {
    backgroundColor: colors.red,
    borderColor: colors.white,
  },
  disabledButton: {
    opacity: 0.5,
  },
  recordText: {
    fontSize: 15,
    color: colors.slate700,
    marginTop: 16,
    textAlign: "center",
  },
  disabledText: {
    color: colors.slate400,
  },
  recordDuration: {
    fontSize: 32,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  playButtonContainer: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledContainer: {
    opacity: 0.5,
  },
  recordInfoContainer: {
    marginTop: 20,
    height: 80,
    // backgroundColor: colors.white,
    // borderRadius: 10,
    // padding: 16,
    // borderColor: colors.primary,
    // borderWidth: 1,
    // borderStyle: "dashed",
  },
  recordInfoText: {
    fontSize: 12,
    color: colors.primary,
    //textAlign: "center",
    lineHeight: 18,
  },
  recordInfoBold: {
    fontWeight: "bold",
    color: colors.primary,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 15,
    color: colors.slate700,
    marginTop: 16,
    textAlign: "center",
  },
  errorText: {
    fontSize: 15,
    color: colors.red,
    marginTop: 16,
    textAlign: "center",
  },
});

export default SpeechRecordScreen;
