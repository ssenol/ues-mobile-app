import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Keyboard,
  ActivityIndicator,
  TextInput,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { useAudioRecorder, setAudioModeAsync, AudioQuality, IOSOutputFormat, useAudioPlayer } from 'expo-audio';
import axios from 'axios';
import api, { API_ENDPOINTS } from '../config/api';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { selectTtsSpeed } from '../store/slices/settingsSlice';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle } from 'expo-status-bar';
import * as FileSystem from 'expo-file-system/legacy';
import { getMicrophoneEnabled, requestMicrophonePermission } from '../utils/helpers';
/*import AutoGrowingTextInput from 'react-native-autogrow-input';*/
import { ThemedText } from '../components/ThemedText';
import ThemedIcon from '../components/ThemedIcon';
import InfoModal from '../components/InfoModal';
import ConfirmModal from '../components/ConfirmModal';
import ScenarioTaskDetails from '../components/ScenarioTaskDetails';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Android için LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SpeechOnScenarioStep2Screen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => selectCurrentUser(state));
  const ttsSpeed = useSelector(selectTtsSpeed);
  const { task } = route.params || {};

  // Dinamik padding değerleri
  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth >= 744;
  const basePadding = isTablet ? 10 : 10;
  
  // Dinamik taskOptionsBar stili
  const taskOptionsBarStyle = {
    backgroundColor: '#3E4EF0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    /*marginBottom: isTablet ? 24 : 8,*/
  };
  
  const [inputText, setInputText] = useState('');
  const [messagesHistory, setMessagesHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [exerciseToken, setExerciseToken] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  // Back butonu kontrolü
  const handleBackPress = () => {
    // Chat başladıysa (bot ilk mesajını gönderdiyse) onay iste
    if (messagesHistory.length > 0) {
      setConfirmModalVisible(true);
    } else {
      // Chat başlamadıysa direkt geri git
      navigation.goBack();
    }
  };

  const handleConfirmBack = () => {
    setConfirmModalVisible(false);
    navigation.goBack();
  };
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [tokenError, setTokenError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [taskDetailsModalVisible, setTaskDetailsModalVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [lastRecordingUri, setLastRecordingUri] = useState(null);
  const [currentTTSAudio, setCurrentTTSAudio] = useState(null);
  const [loadingTTSMessages, setLoadingTTSMessages] = useState(new Map()); // Her mesaj için ayrı loading

  // Platform ve klavye durumuna göre padding hesapla
  const effectiveBottomPadding = useMemo(() => {
    if (keyboardVisible) {
      // Klavye açıkken
      if (Platform.OS === 'ios') {
        // KeyboardAvoidingView zaten padding ekliyor, azaltıyoruz
        return insets.bottom - (isTablet ? 0 : 20);
      } else {
        return insets.bottom + 10;
      }
    } else {
      // Klavye kapalıyken
      if (Platform.OS === 'ios') {
        return insets.bottom - (basePadding - 10);
      } else {
        return insets.bottom + basePadding;
      }
    }
  }, [keyboardVisible, insets.bottom, isTablet, basePadding]);

  const scrollViewRef = useRef(null);

  // TTS Audio player hook
  const ttsPlayer = useAudioPlayer(currentTTSAudio || '');

  // Audio recorder hook
  const recorder = useAudioRecorder(
    {
      android: {
        extension: '.m4a',
        outputFormat: 'mpeg4',
        audioEncoder: 'aac',
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.m4a',
        audioQuality: AudioQuality.MAX,
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        outputFormat: IOSOutputFormat.MPEG4AAC,
      },
      web: {
        mimeType: 'audio/mp4',
        bitsPerSecond: 128000,
      },
    },
    (status) => {
      // Kayıt bittiğinde URI'yi al
      if (status.isFinished && status.url) {
        const uri = status.url;

        // Kayıt durumunu resetle ve URI'yi kaydet
        setRecordingUri(uri);
        setLastRecordingUri(uri);
        setIsRecording(false);

        // Kayıtlı sesi işle
        processAudioToText(uri);
      }
    }
  );

  const MAX_MESSAGES = 5;

  // ArrayBuffer'dan Base64'e çevirme fonksiyonu
  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('dark');
    }, [])
  );

  // Klavye event listener'ları (sadece iOS için)
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardVisible(false);
      });
      
      // Backup listener'lar
      const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });
      const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });

      return () => {
        keyboardWillShowListener.remove();
        keyboardWillHideListener.remove();
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesHistory]);

  // TTS audio otomatik çalma
  useEffect(() => {
    if (currentTTSAudio && ttsPlayer) {
      ttsPlayer.play();
    }
  }, [currentTTSAudio]);

  useEffect(() => {
    initializeChat();
  }, []);

  const generateGuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const initializeChat = async () => {
    if (!task?.assignedTaskId) {
      return;
    }

    const studentId = user?.userId;
    if (!studentId) {
      return;
    }

    setIsLoading(true);
    setTokenError(false);
    try {
      const exerciseTokenPayload = {
        assignedTaskId: task.assignedTaskId,
        assignmentRepeatCount: task.assignmentRepeatCount || 1,
        dueDate: task.dueDate,
        role: 'student',
        startDate: task.startDate || task.speechAssignedDate,
        studentId: studentId,
        taskId: task.speechTaskId,
        taskName: task.speechName || task.task?.setting?.taskName || 'Speech On Scenario',
        taskType: 'speech',
        environment: 'prod',
      };

      const tokenResponse = await api.post(API_ENDPOINTS.student.generateExerciseToken, exerciseTokenPayload);

      if (tokenResponse.data?.status === 'success' && tokenResponse.data?.data?.token) {
        const token = tokenResponse.data.data.token;
        setExerciseToken(token);

        await sendInitialMessage(token);
      }
    } catch (error) {
      console.error('Token oluşturulurken hata:', error);
      console.error('Hata detayı:', error.response?.data);
      setTokenError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    initializeChat();
  };

  const generateExerciseToken = async () => {
    if (!task?.assignedTaskId) {
      return null;
    }

    const studentId = user?.userId;
    if (!studentId) {
      return null;
    }

    try {
      const exerciseTokenPayload = {
        assignedTaskId: task.assignedTaskId,
        assignmentRepeatCount: task.assignmentRepeatCount || 1,
        dueDate: task.dueDate,
        role: 'student',
        startDate: task.startDate || task.speechAssignedDate,
        studentId: studentId,
        taskId: task.speechTaskId,
        taskName: task.speechName || task.task?.setting?.taskName || 'Speech On Scenario',
        taskType: 'speech',
        environment: 'prod',
      };

      const tokenResponse = await api.post(API_ENDPOINTS.student.generateExerciseToken, exerciseTokenPayload);

      if (tokenResponse.data?.status === 'success' && tokenResponse.data?.data?.token) {
        const token = tokenResponse.data.data.token;
        setExerciseToken(token);
        return token;
      }
    } catch (error) {
      console.error('Token oluşturulurken hata:', error);
      console.error('Hata detayı:', error.response?.data);
    }
    return null;
  };

  const sendInitialMessage = async (token) => {
    try {
      const { concept, scenario } = task.task.setting.selectedConcept.concept;
      const { dialogLanguage, userNativeLanguage, conversationLevel } = task.task.setting;

      const messageData = {
        messagesHistory: [],
        userMessage: '',
        dialogLanguage: dialogLanguage || 'en',
        userNativeLanguage: userNativeLanguage || 'tr',
        concept: concept?.replace(/<[^>]*>/g, '').trim() || '',
        scenario: scenario?.replace(/<[^>]*>/g, '').trim() || '',
        conversationLevel: conversationLevel || 'A1',
        username: user.username || 'Student'
      };

      const payload = {
        messageData: JSON.stringify(messageData)
      };

      const response = await axios.post(
        API_ENDPOINTS.speechScenario.chatResponse,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data?.status === 'success' && response.data?.data?.aiResponse) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.data.aiResponse,
          translation: '',
          voiceRecord: null,
          id: generateGuid()
        };

        setMessagesHistory([assistantMessage]);
      }
    } catch (error) {
      console.error('İlk mesaj alınırken hata:', error);
      console.error('Hata detayı:', error.response?.data);
    }
  };

  const handleNext = async () => {
    if (isSubmitting || !exerciseToken) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Messages history'yi API formatına çevir
      const formattedMessages = messagesHistory.map(msg => ({
        role: msg.role,
        content: msg.content || '',
        translation: msg.translation || '',
        voiceRecord: msg.voiceRecord || null,
        correction: msg.correction || '',
        id: msg.id
      }));

      const payload = {
        messages: formattedMessages
      };

      const response = await axios.post(
        API_ENDPOINTS.student.saveSpeechOnScenarioProgress,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${exerciseToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.status === 'success') {
        setSuccessModalVisible(true);
      }
    } catch (error) {
      console.error('Progress kaydedilirken hata:', error);
      console.error('Hata detayı:', error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextToSpeech = async (messageContent) => {
    if (!messageContent) {
      return;
    }

    let tokenToUse = exerciseToken;

    if (!tokenToUse) {
      tokenToUse = await generateExerciseToken();
      if (!tokenToUse) {
        console.error('Exercise token oluşturulamadı, TTS işlenemedi');
        return;
      }
    }

    // Sadece bu mesaj için loading'i true yap
    setLoadingTTSMessages(prev => new Map(prev).set(messageContent, true));

    try {
      const payload = {
        input: messageContent,
        voice: "nova",
        instructions: "",
        accent: "",
        emotion: "",
        intonation: "Expressive",
        speed: ttsSpeed || "natural",
        tone: "",
        whispering: false,
        format: "mp3"
      };

      const response = await axios.post(
        API_ENDPOINTS.question.textToSpeech,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      if (response.data) {
        const arrayBuffer = response.data;
        const base64 = arrayBufferToBase64(arrayBuffer);
        const fileName = `tts_${Date.now()}.mp3`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: 'base64',
        });

        try {
          setCurrentTTSAudio(fileUri);
          setLoadingTTSMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(messageContent);
            return newMap;
          });
        } catch (audioError) {
          console.error('Audio hazırlama hatası:', audioError);
          setLoadingTTSMessages(prev => {
            const newMap = new Map(prev);
            newMap.delete(messageContent);
            return newMap;
          });
        }
      } else {
        setLoadingTTSMessages(prev => {
          const newMap = new Map(prev);
          newMap.delete(messageContent);
          return newMap;
        });
      }
    } catch (error) {
      console.error('Text-to-speech hatası:', error);
      console.error('Hata detayı:', error.response?.data);
      setLoadingTTSMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageContent);
        return newMap;
      });
    }
  };

  const handleVoiceRecording = async () => {
    const hasPermission = await getMicrophoneEnabled();
    if (!hasPermission) {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        return;
      }
    }

    try {
      if (isRecording) {
        recorder.stop();
      } else {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await recorder.prepareToRecordAsync();
        recorder.record();

        setIsRecording(true);
      }
    } catch (error) {
      console.error('Ses kaydı hatası:', error);
      setIsRecording(false);
    }
  };

  const processAudioToText = async (audioUri) => {
    if (!audioUri) {
      return;
    }

    let tokenToUse = exerciseToken;

    if (!tokenToUse) {
      tokenToUse = await generateExerciseToken();
      if (!tokenToUse) {
        console.error('Exercise token oluşturulamadı, ses işlenemedi');
        return;
      }
    }

    setIsProcessingAudio(true);
    try {
      const formData = new FormData();

      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a';
      const fileName = Platform.OS === 'ios' ? 'recording.m4a' : 'recording.m4a';

      formData.append('audioFile', {
        uri: audioUri,
        type: mimeType,
        name: fileName,
      });
      formData.append('language', 'en');

      const response = await axios.post(
        API_ENDPOINTS.question.processAudioToText,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data?.status === 'success' && response.data?.data?.text) {
        const transcribedText = response.data.data.text;

        setInputText(prevText => {
          const newText = prevText ? `${prevText} ${transcribedText}` : transcribedText;
          return newText.trim();
        });

        setRecordingUri(null);
      }
    } catch (error) {
      console.error('Audio-to-text hatası:', error);
      console.error('Hata detayı:', error.response?.data);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending || !exerciseToken || userMessageCount >= MAX_MESSAGES) {
      return;
    }

    const messageText = inputText.trim();

    setInputText('');

    const userMessage = {
      role: 'user',
      content: messageText,
      translation: '',
      voiceRecord: null,
      correction: '',
      id: generateGuid()
    };

    const updatedHistory = [...messagesHistory, userMessage];
    setMessagesHistory(updatedHistory);
    setUserMessageCount(prev => prev + 1);
    setIsSending(true);

    try {
      const { concept, scenario } = task.task.setting.selectedConcept.concept;
      const { dialogLanguage, userNativeLanguage, conversationLevel } = task.task.setting;
      const username = task.task.setting.username || 'Student';

      const messageData = {
        messagesHistory: updatedHistory,
        userMessage: messageText,
        dialogLanguage: dialogLanguage || 'en',
        userNativeLanguage: userNativeLanguage || 'tr',
        concept: concept?.replace(/<[^>]*>/g, '').trim() || '',
        scenario: scenario?.replace(/<[^>]*>/g, '').trim() || '',
        conversationLevel: conversationLevel || 'A1',
        username: username
      };

      const payload = {
        messageData: JSON.stringify(messageData)
      };

      const response = await axios.post(
        API_ENDPOINTS.speechScenario.chatResponse,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${exerciseToken}`
          }
        }
      );

      if (response.data?.status === 'success' && response.data?.data?.aiResponse) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.data.aiResponse,
          translation: '',
          voiceRecord: null,
          id: generateGuid()
        };

        setMessagesHistory([...updatedHistory, assistantMessage]);
      }
    } catch (error) {
      console.error('Mesaj gönderilirken hata:', error);
      console.error('Hata detayı:', error.response?.data);
      const errorMessage = {
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        translation: '',
        voiceRecord: null,
        id: generateGuid(),
        isError: true
      };
      setMessagesHistory([...updatedHistory, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedText>Task data is not available.</ThemedText>
      </SafeAreaView>
    );
  }

  const { taskName } = task.task.setting;

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.headerButton} activeOpacity={0.7}>
          <ThemedIcon iconName="back" size={24} tintColor="#3A3A3A" />
        </TouchableOpacity>
        <ThemedText weight="semibold" style={styles.headerTitle}>{stripHtml(taskName) || 'Speech On Scenario'}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#F3F4FF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -insets.bottom}
      >
        {/* Task Options Bar */}
        <TouchableOpacity
          style={taskOptionsBarStyle}
          onPress={() => setTaskDetailsModalVisible(true)}
          activeOpacity={0.8}
        >
          <ThemedText weight="semiBold" style={styles.taskOptionsText}>Show Task Options</ThemedText>
          <ThemedIcon iconName="upArrow" size={24} tintColor="#fff" />
        </TouchableOpacity>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatAreaContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3E4EF0" />
              <ThemedText style={styles.loadingText}>Starting chat...</ThemedText>
            </View>
          ) : tokenError ? (
            <View style={styles.errorContainer}>
              <ThemedIcon iconName="logout" size={48} tintColor="#FF3B30" />
              <ThemedText weight="semiBold" style={styles.errorTitle}>Connection Error</ThemedText>
              <ThemedText style={styles.errorMessage}>Failed to start conversation. Please try again.</ThemedText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                activeOpacity={0.8}
              >
                <ThemedIcon iconName="refresh" size={20} tintColor="#fff" />
                <ThemedText weight="semiBold" style={styles.retryButtonText}>Retry</ThemedText>
              </TouchableOpacity>
            </View>
          ) : messagesHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>Starting chat...</ThemedText>
            </View>
          ) : (
            messagesHistory.map(msg => (
              <React.Fragment key={msg.id}>
                <View
                  style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                  {msg.role === 'assistant' && (
                    <View style={styles.messageHeader}>
                      <ThemedText weight="semibold" style={styles.messageHeaderText}>TalkBuddy</ThemedText>
                      <TouchableOpacity
                        style={styles.textToSpeechButton}
                        activeOpacity={0.7}
                        onPress={() => handleTextToSpeech(msg.content)}
                        disabled={loadingTTSMessages.has(msg.content)}
                      >
                        {loadingTTSMessages.has(msg.content) ? (
                          <ActivityIndicator size="small" color="#949494" />
                        ) : (
                          <ThemedIcon iconName="textToSpeech" size={20} tintColor="#949494" />
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
                  <ThemedText weight="semiBold" style={styles.messageText}>{msg.content}</ThemedText>
                </View>
              </React.Fragment>
            ))
          )}
          {isSending && (
            <View style={[styles.messageBubble, styles.botBubble]}>
              <ActivityIndicator size="small" color="#3E4EF0" />
            </View>
          )}
        </ScrollView>

        {/* Input Bar or Next Button */}
        {userMessageCount >= MAX_MESSAGES ? (
          <View style={[styles.nextButtonContainer, { paddingBottom: effectiveBottomPadding }]}>
            <TouchableOpacity
              style={[styles.nextButton, isSubmitting && { opacity: 0.6 }]}
              activeOpacity={0.8}
              onPress={handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText weight="bold" style={styles.nextButtonText}>Next</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.inputBar, { paddingBottom: effectiveBottomPadding }]}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              (isRecording || isProcessingAudio) && styles.iconButtonRecording
            ]}
            onPress={handleVoiceRecording}
            disabled={isProcessingAudio}
          >
            <ThemedIcon
              iconName={isRecording ? "stop" : "microphone"}
              size={16}
              tintColor="#fff"
            />
          </TouchableOpacity>
          <View style={styles.textInputContainer}>
            {/*<AutoGrowingTextInput
              style={styles.textInput}
              placeholder="Type or speak with the button"
              placeholderTextColor="#727272"
              value={inputText}
              onChangeText={setInputText}
              minHeight={22} // Sadece lineHeight
              maxHeight={88} // 4 * lineHeight
            />*/}
            <TextInput
              style={styles.textInput}
              placeholder="Type or speak with the button"
              placeholderTextColor="#727272"
              value={inputText}
              onChangeText={setInputText}
              onFocus={() => {
                setKeyboardVisible(true);
              }}
              onBlur={() => {
                setKeyboardVisible(false);
              }}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              blurOnSubmit={false}
              multiline={false}
            />
          </View>
            <TouchableOpacity
              style={[styles.iconButton, (!inputText.trim() || isSending) && styles.iconButtonDisabled]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
            >
              <ThemedIcon iconName="send" size={16} tintColor="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Task Details Modal */}
        <InfoModal
          visible={taskDetailsModalVisible}
          onClose={() => setTaskDetailsModalVisible(false)}
          title="Task Options"
          height={SCREEN_HEIGHT * 0.85}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalView}
            showsVerticalScrollIndicator={true}
          >
            <ScenarioTaskDetails task={task} />
          </ScrollView>
        </InfoModal>

        {/* Success Modal */}
        <ConfirmModal
          visible={successModalVisible}
          onClose={() => {
            setSuccessModalVisible(false);
            navigation.navigate('MainTabs', { screen: 'Home' });
          }}
          iconName="bigcheck"
          title="Task Completed!"
          description="Your task has been successfully submitted. What would you like to do next?"
          actions={[
            {
              text: 'View Report',
              onPress: () => {
                setSuccessModalVisible(false);
                navigation.navigate('MainTabs', { screen: 'Completed' });
              },
              color: '#3E4EF0'
            }
          ]}
          cancelText="Go to Home"
        />

        {/* Confirm Modal for Back Navigation */}
        <ConfirmModal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          onConfirm={handleConfirmBack}
          iconName="info3"
          title="Are you sure?"
          description="If you go back, all conversations will be lost."
          confirmText="Yes, go back"
          cancelText="Cancel"
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
    marginTop: 16
  },
  headerButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    color: '#1c1c1e',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 24,
  },
  taskOptionsText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatAreaContent: {
    padding: 16,
    /*backgroundColor: '#c00',*/
  },
  taskCompletionContainer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  taskCompletionText: {
    fontSize: 18,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  messageBubble: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    maxWidth: '75%',
  },
  userBubble: {
    backgroundColor: '#E7E9FF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 0,
  },
  botBubble: {
    backgroundColor: '#f0f0f0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderText: {
    fontSize: 12,
    color: '#949494',
  },
  textToSpeechButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 12,
    minWidth: '2%',
  },
  nextButtonContainer: {
    padding: 16,
    backgroundColor: '#F3F4FF',
  },
  nextButton: {
    backgroundColor: '#3E4EF0',
    borderRadius: 28,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
  },
  modalView: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    backgroundColor: '#F3F4FF',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#929DFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    color: '#3A3A3A',
    padding: 0,
    margin: 0,
  },
  iconButton: {
    width: 32,
    height: 32,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#3E4EF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  iconButtonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.5,
  },
  iconButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#727272',
  },
  ttsModal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ttsModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: SCREEN_WIDTH * 0.85,
    alignItems: 'center',
  },
  ttsModalTitle: {
    fontSize: 20,
    color: '#3A3A3A',
    marginBottom: 24,
  },
  ttsCloseButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#3E4EF0',
    borderRadius: 12,
  },
  ttsCloseButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#727272',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: '#3A3A3A',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: '#727272',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3E4EF0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  retryButtonText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#fff',
  },
});

export default SpeechOnScenarioStep2Screen;
