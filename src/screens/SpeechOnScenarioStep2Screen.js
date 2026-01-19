import React, { useState, useEffect, useRef } from 'react';
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
import axios from 'axios';
import api, { API_ENDPOINTS } from '../config/api';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/slices/authSlice';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { setStatusBarStyle } from 'expo-status-bar';
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
  const { task } = route.params || {};

  const [taskDetailsModalVisible, setTaskDetailsModalVisible] = useState(false);
  const [inputPaddingBottom, setInputPaddingBottom] = useState(insets.bottom > 0 ? insets.bottom : 16);
  const [inputText, setInputText] = useState('');
  const [messagesHistory, setMessagesHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [exerciseToken, setExerciseToken] = useState(null);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [tokenError, setTokenError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  
  const scrollViewRef = useRef(null);
  
  const MAX_MESSAGES = 5;

  useFocusEffect(
    React.useCallback(() => {
      setStatusBarStyle('dark');
    }, [])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setInputPaddingBottom(16);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setInputPaddingBottom(insets.bottom > 0 ? insets.bottom : 16);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [insets.bottom]);

  useEffect(() => {
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesHistory]);

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
    // console.log('task', task);
    // console.log('user', user);

    if (!task?.assignedTaskId) {
      console.log('❌ Task ID bulunamadı');
      return;
    }
    
    const studentId = user?.userId;
    if (!studentId) {
      console.log('❌ Student ID bulunamadı');
      return;
    }
    
    // console.log('🚀 Chat başlatılıyor...');
    // console.log('📋 Task ID:', task.assignedTaskId);
    // console.log('👤 Student ID:', studentId);
    
    setIsLoading(true);
    setTokenError(false);
    try {
      // console.log('🔑 Token alınıyor...');
      
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
      
      // console.log('📦 Exercise Token Payload:', JSON.stringify(exerciseTokenPayload, null, 2));
      
      const tokenResponse = await api.post(API_ENDPOINTS.student.generateExerciseToken, exerciseTokenPayload);
      
      // console.log('✅ Token Response:', tokenResponse.data);
      
      if (tokenResponse.data?.status === 'success' && tokenResponse.data?.data?.token) {
        const token = tokenResponse.data.data.token;
        // console.log('🎫 Token alındı:', token);
        setExerciseToken(token);
        
        await sendInitialMessage(token);
      } else {
        console.log('❌ Token alınamadı:', tokenResponse.data);
      }
    } catch (error) {
      console.error('❌ Token oluşturulurken hata:', error);
      console.error('Hata detayı:', error.response?.data);
      setTokenError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    initializeChat();
  };

  const sendInitialMessage = async (token) => {
    try {
      // console.log('💬 İlk mesaj gönderiliyor...');
      
      const { concept, scenario } = task.task.setting.selectedConcept.concept;
      const { dialogLanguage, userNativeLanguage, conversationLevel } = task.task.setting;
      // const username = task.task.setting.username || 'Student';
      
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
      
      // console.log('📤 İlk Mesaj Payload:', JSON.stringify(payload, null, 2));
      // console.log('🔐 Authorization Token:', token);
      
      const response = await axios.post(
        API_ENDPOINTS.speechScenario.chatResponse,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // console.log('📥 İlk Mesaj Response:', response.data);
      
      if (response.data?.status === 'success' && response.data?.data?.aiResponse) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.data.aiResponse,
          translation: '',
          voiceRecord: null,
          id: generateGuid()
        };
        
        // console.log('✅ İlk bot mesajı alındı:', assistantMessage.content);
        setMessagesHistory([assistantMessage]);
      } else {
        console.log('❌ İlk mesaj alınamadı:', response.data);
      }
    } catch (error) {
      console.error('❌ İlk mesaj alınırken hata:', error);
      console.error('Hata detayı:', error.response?.data);
    }
  };

  const handleNext = async () => {
    if (isSubmitting || !exerciseToken) {
      console.log('⚠️ Submit edilemiyor:', { isSubmitting, hasToken: !!exerciseToken });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📤 Progress kaydediliyor...');
      
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

      // console.log('📦 Progress Payload:', JSON.stringify(payload, null, 2));
      // console.log('🔐 Authorization Token:', exerciseToken);

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

      // console.log('✅ Progress Response:', response.data);

      if (response.data?.status === 'success') {
        // console.log('✅ Progress başarıyla kaydedildi');
        setSuccessModalVisible(true);
      } else {
        // console.log('⚠️ Progress kaydedilemedi:', response.data);
      }
    } catch (error) {
      console.error('❌ Progress kaydedilirken hata:', error);
      console.error('Hata detayı:', error.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isSending || !exerciseToken || userMessageCount >= MAX_MESSAGES) {
      console.log('⚠️ Mesaj gönderilemedi:', {
        inputText: inputText.trim(),
        isSending,
        exerciseToken: !!exerciseToken,
        userMessageCount,
        MAX_MESSAGES
      });
      return;
    }
    
    const messageText = inputText.trim();
    console.log('💬 Kullanıcı mesajı gönderiliyor:', messageText);
    console.log('📊 Mesaj sayısı:', userMessageCount + 1, '/', MAX_MESSAGES);
    
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
      
      console.log('📤 Mesaj Payload:', JSON.stringify(payload, null, 2));
      console.log('🔐 Authorization Token:', exerciseToken);
      
      const response = await axios.post(
        API_ENDPOINTS.speechScenario.chatResponse,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${exerciseToken}`
          }
        }
      );
      
      console.log('📥 Mesaj Response:', response.data);
      
      if (response.data?.status === 'success' && response.data?.data?.aiResponse) {
        const assistantMessage = {
          role: 'assistant',
          content: response.data.data.aiResponse,
          translation: '',
          voiceRecord: null,
          id: generateGuid()
        };
        
        console.log('✅ Bot yanıtı alındı:', assistantMessage.content);
        setMessagesHistory([...updatedHistory, assistantMessage]);
      } else {
        console.log('❌ Bot yanıtı alınamadı:', response.data);
      }
    } catch (error) {
      console.error('❌ Mesaj gönderilirken hata:', error);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton} activeOpacity={0.7}>
          <ThemedIcon iconName="back" size={24} tintColor="#3A3A3A" />
        </TouchableOpacity>
        <ThemedText weight="semibold" style={styles.headerTitle}>{stripHtml(taskName) || 'Speech On Scenario'}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Task Options Bar */}
        <TouchableOpacity 
          style={styles.taskOptionsBar} 
          onPress={() => setTaskDetailsModalVisible(true)}
          activeOpacity={0.8}
        >
          <ThemedText weight="semiBold" style={styles.taskOptionsText}>Show Task Options</ThemedText>
          <ThemedIcon iconName="upArrow" size={24} tintColor="#fff" />
        </TouchableOpacity>

        {/* Task Completion */}
        <View style={styles.taskCompletionContainer}>
          <ThemedText weight="black" style={styles.taskCompletionText}>
            Task Completion {Math.round((userMessageCount / MAX_MESSAGES) * 100)}%
          </ThemedText>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(userMessageCount / MAX_MESSAGES) * 100}%` }]} />
          </View>
        </View>

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
              <View 
                key={msg.id} 
                style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                <ThemedText weight="semiBold" style={styles.messageText}>{msg.content}</ThemedText>
              </View>
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
          <View style={[styles.nextButtonContainer, { paddingBottom: inputPaddingBottom }]}>
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
          <View style={[styles.inputBar, { paddingBottom: inputPaddingBottom }]}>
          <TouchableOpacity style={styles.iconButton}>
            <ThemedIcon iconName="voice" size={16} tintColor="#fff" />
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
  taskOptionsBar: {
    backgroundColor: '#3E4EF0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  taskOptionsText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22
  },
  chatArea: {
    flex: 1,
  },
  chatAreaContent: {
    paddingHorizontal: 16,
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
