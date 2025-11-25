import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { AudioQuality, IOSOutputFormat, setAudioModeAsync, useAudioPlayer, useAudioRecorder } from 'expo-audio';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, LayoutAnimation, Linking, Platform, ScrollView, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import Modal from 'react-native-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import LoadingOverlay from '../components/LoadingOverlay';
import ThemedIcon from '../components/ThemedIcon';
import { ThemedText } from '../components/ThemedText';
import { generateExerciseToken, submitSpeechTask } from '../services/speak';
import { selectCurrentUser } from '../store/slices/authSlice';
import { getMicrophoneEnabled, requestMicrophonePermission } from '../utils/helpers';

// Android için LayoutAnimation'ı etkinleştir
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AssignmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const user = useSelector((state) => selectCurrentUser(state));
  const STATUSBAR_HEIGHT = insets.top;
  
  const { task: taskFromParams, assignedTaskId, speechTaskId } = route.params || {};
  
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [recordingState, setRecordingState] = useState('idle'); // 'idle', 'recording', 'paused', 'finished'
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isStartingRecording, setIsStartingRecording] = useState(false);
  const [task, setTask] = useState(null);
  const [taskText, setTaskText] = useState('');
  const [taskType, setTaskType] = useState(null); // 'speech_on_topic' or 'read_aloud'
  const [metadata, setMetadata] = useState([]);
  const [maxDuration, setMaxDuration] = useState(null); // in seconds, for speech on topic
  const [recordedUri, setRecordedUri] = useState(null);
  const [finishModalVisible, setFinishModalVisible] = useState(false);
  const [activeWaveformIndex, setActiveWaveformIndex] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState([]);
  const [audioWaveformIndex, setAudioWaveformIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const countdownIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const waveformIntervalRef = useRef(null);
  const audioWaveformIntervalRef = useRef(null);
  const pausedDurationRef = useRef(0);
  const notificationSlideAnim = useRef(new Animated.Value(0)).current; // 0 = gizli (record button içinde)
  
  // Audio player hook
  const player = useAudioPlayer(recordedUri || '');
  
  // expo-audio recorder hook
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
      if (status.isRecording) {
        setRecordingDuration(status.currentTime || 0);
      } else {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      }
    }
  );

  // AssignmentDetailScreen focus olduğunda StatusBar'ı sıfırla
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => {};
    }, [])
  );

  // HTML'den metni temizle
  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  };

  // Navigation params'dan gelen task'ı işle
  useEffect(() => {
    if (taskFromParams) {
      setTask(taskFromParams);
      setTaskType(taskFromParams.speechTaskType);
      
      // Task tipine göre metni ve metadata'yı ayarla
      if (taskFromParams.speechTaskType === 'speech_on_topic') {
        setTaskText(taskFromParams.task?.data?.topic || '');
        
        // Speech on Topic metadata
        const taskMetadata = [];
        
        // Duration (saniye cinsinden string: "30-50")
        const durationString = taskFromParams.task?.data?.duration;
        
        let maxDurationInSeconds = null;
        if (durationString) {
          // "30-50" gibi bir string'den maximum değeri al
          const parts = durationString.split('-');
          if (parts.length === 2) {
            maxDurationInSeconds = parseInt(parts[1].trim(), 10);
          } else {
            // Tek bir sayı varsa onu kullan
            maxDurationInSeconds = parseInt(durationString.trim(), 10);
          }
          
          if (maxDurationInSeconds && !isNaN(maxDurationInSeconds)) {
            taskMetadata.push({ 
              icon: 'time', 
              label: `${maxDurationInSeconds} Seconds` 
            });
            setMaxDuration(maxDurationInSeconds); // Saniye cinsinden set et
          }
        }
        
        // Min sentences count
        if (taskFromParams.task?.data?.minSentencesCount) {
          taskMetadata.push({ 
            icon: 'sentences', 
            label: `${taskFromParams.task.data.minSentencesCount} Sentences` 
          });
        }
        
        // Min word count
        if (taskFromParams.task?.data?.minWordCount) {
          taskMetadata.push({ 
            icon: 'words', 
            label: `${taskFromParams.task.data.minWordCount} Words` 
          });
        }
        
        setMetadata(taskMetadata);
      } else if (taskFromParams.speechTaskType === 'read_aloud') {
        const readingText = taskFromParams.task?.data?.readingText || '';
        setTaskText(stripHtml(readingText));
        
        // Read Aloud metadata
        const taskMetadata = [];
        
        // CEFR Level
        if (taskFromParams.task?.setting?.cefrLevel) {
          taskMetadata.push({ 
            icon: 'cefr', 
            label: taskFromParams.task.setting.cefrLevel 
          });
        }
        
        // Subject/Topic
        if (taskFromParams.task?.data?.aiReadingMetaData?.subject) {
          taskMetadata.push({ 
            icon: 'topic', 
            label: taskFromParams.task.data.aiReadingMetaData.subject 
          });
        }
        
        setMetadata(taskMetadata);
      }
    } else if (!assignedTaskId && !speechTaskId) {
      // Task bilgisi yoksa geri dön
      Alert.alert('Error', 'Task information not found');
      navigation.goBack();
    }
  }, [taskFromParams, assignedTaskId, speechTaskId, navigation]);

  const handleRecordPress = async () => {
    try {
      const hasPermission = await getMicrophoneEnabled();
      if (!hasPermission) {
        setPermissionModalVisible(true);
      } else {
        // İzin varsa countdown başlat
        startCountdown();
      }
    } catch (error) {
      console.error('Error in handleRecordPress:', error);
      Alert.alert('Error', `Failed to check permissions: ${error.message}`);
    }
  };

  const handleAllowPermission = async () => {
    const granted = await requestMicrophonePermission();
    setPermissionModalVisible(false);
    if (granted) {
      // Countdown başlat
      startCountdown();
    } else {
      // İzin verilmedi, ayarlara yönlendir
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    setRecordingState('idle');
    setRecordingDuration(0);
    setIsStartingRecording(false);
    pausedDurationRef.current = 0;
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          setCountdown(0);
          setIsStartingRecording(true);
          startRecording().then(() => {
            setIsStartingRecording(false);
          }).catch(() => {
            setIsStartingRecording(false);
            setRecordingState('idle');
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = async () => {
    try {
      // iOS'ta kayıt yapabilmek için audio mode'u ayarla
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true, // iOS'ta kayıt için true olmalı
      });
      
      // expo-audio'da önce prepareToRecordAsync çağrılmalı
      await recorder.prepareToRecordAsync();
      
      // Kayıt başlat
      recorder.record();
      
      setRecordingDuration(0);
      setIsStartingRecording(false);
      setRecordingState('recording');
      setActiveWaveformIndex(0);

      // Timer başlat (duration tracking için)
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          
          // Eğer speech on topic ise ve maxDuration varsa, otomatik durdur
          if (taskType === 'speech_on_topic' && maxDuration && newDuration >= maxDuration) {
            pauseRecording();
            return prev; // Son değeri döndür
          }
          
          return newDuration;
        });
      }, 1000);

      // Waveform animasyonu başlat (her 250ms'de bir bar kırmızı olsun)
      waveformIntervalRef.current = setInterval(() => {
        setActiveWaveformIndex((prev) => {
          const nextIndex = (prev + 1) % 25;
          // Başa döndüğünde yeni random yükseklikler oluştur
          if (nextIndex === 0) {
            setWaveformHeights(generateRandomHeights());
          }
          return nextIndex;
        });
      }, 250);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', `Failed to start recording: ${err.message || err.toString()}`);
      setRecordingState('idle');
      setIsStartingRecording(false);
      setCountdown(0);
    }
  };

  const pauseRecording = async () => {
    try {
      if (recorder && recordingState === 'recording') {
        await recorder.pause();
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        if (waveformIntervalRef.current) {
          clearInterval(waveformIntervalRef.current);
          waveformIntervalRef.current = null;
        }
        
        pausedDurationRef.current = recordingDuration;
        setRecordingState('paused');
      }
    } catch (err) {
      console.error('Failed to pause recording', err);
      Alert.alert('Error', `Failed to pause recording: ${err.message || err.toString()}`);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recorder && recordingState === 'paused') {
        recorder.record();
        setRecordingState('recording');

        // Timer'ı kaldığı yerden devam ettir
        timerIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => {
            const newDuration = prev + 1;
            
            // Eğer speech on topic ise ve maxDuration varsa, otomatik durdur
            if (taskType === 'speech_on_topic' && maxDuration && newDuration >= maxDuration) {
              pauseRecording();
              return prev;
            }
            
            return newDuration;
          });
        }, 1000);

        // Waveform animasyonunu yeniden başlat
        waveformIntervalRef.current = setInterval(() => {
          setActiveWaveformIndex((prev) => {
            const nextIndex = (prev + 1) % 25;
            // Başa döndüğünde yeni random yükseklikler oluştur
            if (nextIndex === 0) {
              setWaveformHeights(generateRandomHeights());
            }
            return nextIndex;
          });
        }, 250);
      }
    } catch (err) {
      console.error('Failed to resume recording', err);
      Alert.alert('Error', `Failed to resume recording: ${err.message || err.toString()}`);
    }
  };

  const finishRecording = async () => {
    try {
      if (recorder && (recordingState === 'recording' || recordingState === 'paused')) {
        // Eğer pause durumundaysa önce resume et sonra stop et
        if (recordingState === 'paused') {
          // Pause durumundayken stop etmek için önce recorder'ı hazırla
        }
        
        // expo-audio'da stop
        await recorder.stop();
        const uri = recorder.uri;
        
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        if (waveformIntervalRef.current) {
          clearInterval(waveformIntervalRef.current);
          waveformIntervalRef.current = null;
        }

        if (!uri) {
          throw new Error('Recording URI not available');
        }

        setRecordedUri(uri);
        setRecordingState('finished');
        setFinishModalVisible(true);
      }
    } catch (err) {
      console.error('Failed to finish recording', err);
      Alert.alert('Error', `Failed to finish recording: ${err.message || err.toString()}`);
      setRecordingState('idle');
    }
  };

  const handleRetry = () => {
    // Audio'yu durdur
    if (player.playing) {
      player.pause();
    }
    if (audioWaveformIntervalRef.current) {
      clearInterval(audioWaveformIntervalRef.current);
      audioWaveformIntervalRef.current = null;
    }
    
    setFinishModalVisible(false);
    setRecordingState('idle');
    setRecordingDuration(0);
    setRecordedUri(null);
    setActiveWaveformIndex(0);
    setWaveformHeights(generateRandomHeights());
    setAudioWaveformIndex(0);
    pausedDurationRef.current = 0;
  };

  const handleSubmit = async () => {
    if (!task || !recordedUri || !recordingDuration) {
      Alert.alert('Error', 'Missing required information');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Audio'yu durdur
      if (player.playing) {
        player.pause();
      }
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
        audioWaveformIntervalRef.current = null;
      }

      // Get user ID
      const studentId = user?.id || user?._id || user?.userId;
      if (!studentId) {
        Alert.alert('Error', 'User information not found');
        setIsSubmitting(false);
        return;
      }

      // Prepare exercise token payload
      const exerciseTokenPayload = {
        assignedTaskId: task.assignedTaskId || assignedTaskId,
        assignmentRepeatCount: task.assignmentRepeatCount || 1,
        dueDate: task.dueDate,
        role: 'student',
        startDate: task.startDate || task.speechAssignedDate,
        studentId: studentId,
        taskId: task.speechTaskId || speechTaskId,
        taskName: task.speechName || task.task?.setting?.taskName || 'Speech Task',
        taskType: task.speechTaskType === 'speech_on_topic' ? 'speech' : 'speech',
        environment: 'prod',
      };

      // Step 1: Generate Exercise Token
      const tokenResponse = await generateExerciseToken(exerciseTokenPayload);
      
      if (!tokenResponse?.data?.token) {
        throw new Error('Failed to generate exercise token');
      }

      const exerciseToken = tokenResponse.data.token;

      // Step 2: Submit Speech Task
      const submitResponse = await submitSpeechTask(recordedUri, recordingDuration, exerciseToken);

      if (submitResponse?.status === 'success' || submitResponse?.successed) {
        setFinishModalVisible(false);
        
        // Alert.alert(
        //   'Success',
        //   'Your speech task has been submitted successfully. Processing in background.',
        //   [
        //     {
        //       text: 'OK',
        //       onPress: () => {
        //         // Navigate to Completed screen
        //         navigation.navigate('MainTabs', { screen: 'Completed' });
        //       },
        //     },
        //   ]
        // );
      } else {
        throw new Error('Failed to submit speech task');
      }
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || error.message || 'Failed to submit speech task. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Audio player fonksiyonları
  const playAudio = () => {
    player.play();
    
    // Waveform animasyonunu başlat
    if (!audioWaveformIntervalRef.current) {
      audioWaveformIntervalRef.current = setInterval(() => {
        setAudioWaveformIndex((prev) => (prev + 1) % 20);
      }, 250);
    }
  };

  const pauseAudio = () => {
    player.pause();
    
    // Waveform animasyonunu durdur
    if (audioWaveformIntervalRef.current) {
      clearInterval(audioWaveformIntervalRef.current);
      audioWaveformIntervalRef.current = null;
    }
  };

  const stopAudio = () => {
    player.seekTo(0);
    player.pause();
    setAudioWaveformIndex(0);
    
    // Waveform animasyonunu durdur
    if (audioWaveformIntervalRef.current) {
      clearInterval(audioWaveformIntervalRef.current);
      audioWaveformIntervalRef.current = null;
    }
  };

  // Player durumunu izle
  useEffect(() => {
    // Eğer ses bittiyse
    if (player.duration > 0 && player.currentTime >= player.duration && player.playing === false) {
      setAudioWaveformIndex(0);
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
        audioWaveformIntervalRef.current = null;
      }
    }
  }, [player.currentTime, player.duration, player.playing]);

  // Modal açıldığında/kapandığında cleanup
  useEffect(() => {
    if (!finishModalVisible) {
      // Modal kapandığında player'ı durdur ve temizle
      if (player.playing) {
        player.pause();
      }
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
        audioWaveformIntervalRef.current = null;
      }
      setAudioWaveformIndex(0);
    }
  }, [finishModalVisible]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerDisplay = () => {
    if (taskType === 'speech_on_topic' && maxDuration) {
      return `${formatTimer(recordingDuration)} / ${formatTimer(maxDuration)}`;
    }
    return formatTimer(recordingDuration);
  };

  // Random yükseklikler generate et (40% ile 95% arası)
  const generateRandomHeights = () => {
    return Array.from({ length: 25 }, () => Math.floor(Math.random() * 55) + 20);
  };

  const getWaveformHeight = (index) => {
    if (waveformHeights.length === 0) return '60%';
    return `${waveformHeights[index]}%`;
  };

  // İlk yüklemede random yükseklikler oluştur
  useEffect(() => {
    setWaveformHeights(generateRandomHeights());
  }, []);

  // Waveform index değiştiğinde smooth animation
  useEffect(() => {
    if (recordingState === 'recording' || recordingState === 'paused') {
      LayoutAnimation.configureNext({
        duration: 150,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
      });
    }
  }, [activeWaveformIndex, recordingState]);

  // Notification slide animation - sadece pause durumunda göster
  useEffect(() => {
    if (recordingState === 'paused') {
      // Yukarı kaydır (göster)
      Animated.spring(notificationSlideAnim, {
        toValue: -76,  // Record button'un 76px üstünde
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Aşağı kaydır (gizle) - record button container'ın içine
      Animated.timing(notificationSlideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [recordingState]);

  // Geri tuşu ile sayfadan çıkılmaya çalışıldığında uyarı ver
  // Android'de donanım geri tuşu
  // iOS'ta swipe gesture
  // Programatik navigasyon
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (recordingState === 'recording' || recordingState === 'paused' || countdown > 0 || isStartingRecording) {
        // Prevent default behavior of leaving the screen
        e.preventDefault();
        Alert.alert(
          'Recording in Progress',
          'You cannot leave while recording. Please stop the recording first.',
          [{ text: 'OK' }]
        );
      }
    });

    return unsubscribe;
  }, [navigation, recordingState, countdown, isStartingRecording]);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (waveformIntervalRef.current) {
        clearInterval(waveformIntervalRef.current);
        waveformIntervalRef.current = null;
      }
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
        audioWaveformIntervalRef.current = null;
      }
    };
  }, []);

  const handleDeclinePermission = () => {
    setPermissionModalVisible(false);
  };

  const getHeaderTitle = () => {
    if (taskType === 'speech_on_topic') {
      return 'Speech on Topic';
    } else if (taskType === 'read_aloud') {
      return 'Read Aloud';
    }
    return 'Speech On Topic';
  };

  const getInfoBannerText = () => {
    if (taskType === 'speech_on_topic') {
      return 'Press record to speak about the topic.';
    } else if (taskType === 'read_aloud') {
      return 'Press record to read the text aloud.';
    }
    return 'Press record to start.';
  };


  if (!task) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" translucent backgroundColor="transparent" />
        <View style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <ThemedIcon
              iconName="back"
              size={24}
              tintColor="#3A3A3A"
            />
          </TouchableOpacity>
          <ThemedText weight="bold" style={styles.headerTitle}>Error</ThemedText>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText style={styles.loadingText}>Task not found</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Header */}
      <View 
        style={[styles.header, { paddingTop: STATUSBAR_HEIGHT }]}
      >
        {!(recordingState === 'recording' || recordingState === 'paused' || countdown > 0 || isStartingRecording) ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.headerBackButton}
            activeOpacity={0.7}
          >
            <ThemedIcon
              iconName="back"
              size={24}
              tintColor="#3A3A3A"
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBackButton} />
        )}
        <ThemedText weight="bold" style={styles.headerTitle}>{getHeaderTitle()}</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <ThemedIcon
          iconName="info"
          size={20}
          tintColor="#3E4EF0"
        />
        <ThemedText weight='semiBold' style={styles.infoBannerText}>
          {getInfoBannerText()}
        </ThemedText>
      </View>

      {/* Metadata Section */}
      {metadata.length > 0 && (
        <View style={styles.metadataContainer}>
          {metadata.map((item, index) => (
            <View key={index} style={styles.metadataItem}>
              <ThemedIcon
                iconName={item.icon}
                size={16}
                tintColor="#3E4EF0"
              />
              <ThemedText style={styles.metadataText}>{item.label}</ThemedText>
            </View>
          ))}
          
          {/* Progress Bar - only for speech on topic during recording */}
          {taskType === 'speech_on_topic' && (recordingState === 'recording' || recordingState === 'paused') && maxDuration && (
            <View style={styles.progressBarInMetadata}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min((recordingDuration / maxDuration) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* Text Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 100 + Math.max(insets.bottom, 16) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          taskType === 'speech_on_topic' && styles.taskTextContainer
        ]}>
          <ThemedText style={[
            styles.taskText,
            { fontSize: taskType === 'speech_on_topic' ? 20 : 18 },
            { lineHeight: taskType === 'speech_on_topic' ? 30 : 26 },
            { color: recordingState === 'recording' ? '#3A3A3A' : '#B7B7B7' }
          ]}>
            {taskText || 'No content available'}
          </ThemedText>
        </View>
      </ScrollView>

      {/* Recording Notification Banner - sadece pause durumunda */}
      <Animated.View 
        style={[
          styles.recordingNotification,
          {
            transform: [{ translateY: notificationSlideAnim }],
            opacity: notificationSlideAnim.interpolate({
              inputRange: [-76, 0],
              outputRange: [1, 0],
            }),
            bottom: 56,  // Record button ile aynı hizada başlıyor
          }
        ]}
        pointerEvents={recordingState === 'paused' ? 'auto' : 'none'}
      >
        <ThemedText weight="semibold" style={styles.notificationText}>
          You can continue or end audio recording.
        </ThemedText>
      </Animated.View>

      {/* Floating Record Button */}
      {!permissionModalVisible && countdown === 0 && !isStartingRecording && recordingState !== 'finished' && (
        <View style={styles.floatingButtonContainer}>
          <View style={styles.recordButtonWrapper}>
            {/* Left Button - Microphone or Pause */}
            <TouchableOpacity
              style={styles.recordButtonLeft}
              activeOpacity={0.8}
              onPress={() => {
                if (recordingState === 'idle') {
                  handleRecordPress();
                } else if (recordingState === 'recording') {
                  pauseRecording();
                } else if (recordingState === 'paused') {
                  resumeRecording();
                }
              }}
            >
              <ThemedIcon
                iconName={recordingState === 'recording' ? 'pause' : 'record'}
                size={24}
                tintColor="#fff"
              />
            </TouchableOpacity>

            {/* Center - Waveform or Dotted Line */}
            <View style={styles.recordButtonCenter}>
              {recordingState === 'idle' ? (
                <View style={styles.dottedLineContainer}>
                  {[...Array(40)].map((_, i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.dot,
                        i === 0 && styles.firstDot
                      ]} 
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.waveformContainer}>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24].map((i) => {
                    // Henüz geçilmemiş indexler -> nokta
                    if (i > activeWaveformIndex) {
                      return <View key={i} style={styles.waveformDot} />;
                    }
                    // Şu anki index -> kırmızı bar (recording veya paused durumunda)
                    if (i === activeWaveformIndex && (recordingState === 'recording' || recordingState === 'paused')) {
                      return (
                        <View
                          key={i}
                          style={[
                            styles.waveformBar,
                            { height: getWaveformHeight(i) },
                            styles.waveformBarActive,
                          ]}
                        />
                      );
                    }
                    // Geçilmiş indexler -> mavi bar
                    return (
                      <View
                        key={i}
                        style={[
                          styles.waveformBar,
                          { height: getWaveformHeight(i) },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
              <ThemedText weight="semibold" style={styles.timerText}>
                {formatTimer(recordingDuration)}
              </ThemedText>
            </View>

            {/* Right Button - Arrow (visible only when recording/paused) */}
            {(recordingState === 'recording' || recordingState === 'paused') && (
              <TouchableOpacity
                style={[
                  styles.recordButtonRight,
                  recordingState === 'paused' && styles.recordButtonRightActive
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (recordingState === 'paused') {
                    finishRecording();
                  }
                }}
                disabled={recordingState === 'recording'}
              >
                <ThemedIcon
                  iconName="recorddone"
                  size={24}
                  tintColor={recordingState === 'paused' ? '#fff' : '#ABB3FF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Countdown Overlay */}
      {countdown > 0 && (
        <Modal
          isVisible={countdown > 0}
          style={styles.countdownModal}
          backdropColor="#3E4EF0"
          backdropOpacity={0.7}
          animationIn="fadeIn"
          animationOut="fadeOut"
        >
          <View style={styles.countdownContainer}>
            <ThemedText weight="bold" style={styles.countdownText}>
              {countdown.toString()}
            </ThemedText>
          </View>
        </Modal>
      )}

      {/* Finish Recording Modal */}
      <Modal
        isVisible={finishModalVisible}
        onBackdropPress={() => {}}
        style={styles.finishModal}
        backdropColor="#3E4EF0"
        backdropOpacity={0.5}
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={[styles.finishModalContent, { paddingBottom: Math.max(insets.bottom, 36) }]}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <ThemedIcon
              iconName="bigcheck"
              size={80}
              tintColor="#3E4EF0"
            />
          </View>

          {/* Success Message */}
          <ThemedText weight="bold" style={styles.successTitle}>
            Your voice recorded has been{'\n'}successfully
          </ThemedText>

          {/* Audio Player */}
          <View style={styles.audioPlayerContainer}>
            <TouchableOpacity
              style={styles.playPauseButton}
              activeOpacity={0.8}
              onPress={() => {
                if (player.playing) {
                  pauseAudio();
                } else {
                  playAudio();
                }
              }}
            >
              <ThemedIcon
                iconName={player.playing ? 'pause' : 'play'}
                size={24}
                tintColor="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stopButton}
              activeOpacity={0.8}
              onPress={stopAudio}
            >
              <View style={styles.stopButtonInner} />
            </TouchableOpacity>

            {/* Waveform */}
            <View style={styles.audioWaveformContainer}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.audioWaveformBar,
                    { height: getWaveformHeight(i) },
                    player.playing && i === audioWaveformIndex && styles.audioWaveformBarActive
                  ]}
                />
              ))}
            </View>

            {/* Timer */}
            <ThemedText style={styles.audioTimerText}>
              {formatTimer(Math.floor(player.currentTime))} / {formatTimer(recordingDuration)}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={styles.finishModalButtons}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <ThemedText weight="bold" style={styles.retryButtonText}>
                Retry
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <ThemedText weight="bold" style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Microphone Permission Modal */}
      <Modal
        isVisible={permissionModalVisible}
        onBackdropPress={handleDeclinePermission}
        style={styles.modal}
        backdropColor="#3E4EF0"
        backdropOpacity={0.7}
        useNativeDriverForBackdrop
        useNativeDriver
        hideModalContentWhileAnimating
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Microphone Icon */}
          <View style={styles.modalIconContainer}>
            <ThemedIcon
              iconName="bigmic"
              size={80}
              tintColor="#3E4EF0"
            />
          </View>

          {/* Title */}
          <ThemedText weight="bold" style={styles.modalTitle}>
            Microphone Permission Required!
          </ThemedText>

          {/* Description */}
          <ThemedText style={styles.modalDescription}>
            You must grant microphone permission to use the speak features.
          </ThemedText>

          {/* Buttons */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleAllowPermission}
              activeOpacity={0.8}
            >
              <ThemedText weight="bold" style={styles.allowButtonText}>
                Allow
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={handleDeclinePermission}
              activeOpacity={0.8}
            >
              <ThemedText weight="bold" style={styles.declineButtonText}>
                Decline
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      <LoadingOverlay visible={isSubmitting} message="Submitting speech task..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerBackButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3A3A3A',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D9DDFF',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    marginBottom: 12,
  },
  infoBannerText: {
    fontSize: 14,
    color: '#3A3A3A',
    marginLeft: 8,
    flex: 1,
  },
  metadataContainer: {
    backgroundColor: '#F3F4FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9FF',
    padding: 24,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#3E4EF0',
    marginLeft: 6,
  },
  progressBarInMetadata: {
    width: '100%',
  },
  progressBar: {
    marginTop: 16,
    height: 12,
    backgroundColor: '#D8DCFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3E4EF0',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  taskTextContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E9FF',
    padding: 24,
  },
  taskText: {
    textAlign: 'left',
  },
  recordingNotification: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 5,  // Record button'un altında (10'un altı)
    backgroundColor: '#3E4EF0',
    borderRadius: 50,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3E4EF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
    textAlign: 'center',
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    bottom: 36,
  },
  recordButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7E9FF',
    borderRadius: 48,
    padding: 16,
    minWidth: '100%',
  },
  recordButtonLeft: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3E4EF0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  dottedLineContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 8,
    paddingHorizontal: 4,
    height: 36,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#ABB3FF',
  },
  firstDot: {
    height: 21,
    width: 3,
    borderRadius: 1.5,
  },
  waveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 36,
    marginRight: 8,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#3D4FF0',
    borderRadius: 3,
    opacity: 0.9,
  },
  waveformBarActive: {
    backgroundColor: '#FE1900',
    opacity: 1,
    shadowColor: '#FE1900',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  waveformDot: {
    width: 3,
    height: 3,
    backgroundColor: '#ABB3FF',
    borderRadius: 1.5,
    opacity: 0.6,
  },
  timerText: {
    fontSize: 14,
    color: '#3E4EF0',
    minWidth: 50,
    textAlign: 'right',
  },
  recordButtonRight: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D9DDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  recordButtonRightActive: {
    backgroundColor: '#3a3a3a',
  },
  countdownModal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
  },
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 128,
    color: '#fff',
  },
  finishModal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  finishModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    width: '100%',
  },
  successIconContainer: {
    marginBottom: 12,
    width: 72,
    height: 72,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    textAlign: 'center',
    marginBottom: 64,
  },
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7E9FF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  playPauseButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3E4EF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3E4EF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopButtonInner: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  audioWaveformContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    marginRight: 12,
  },
  audioWaveformBar: {
    width: 2,
    backgroundColor: '#3E4EF0',
    borderRadius: 1,
    opacity: 0.8,
  },
  audioWaveformBarActive: {
    backgroundColor: '#FE1900',
    opacity: 1,
  },
  audioTimerText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#3E4EF0',
    backgroundColor: '#D9DDFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  finishModalButtons: {
    width: '100%',
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flex: 1,
    // backgroundColor: '#fff',
    // borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 2,
    // borderColor: '#3E4EF0',
  },
  retryButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3E4EF0',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3E4EF0',
    borderRadius: 50,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  modal: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    marginBottom: 48,
  },
  modalIconContainer: {
    marginBottom: 24,
    backgroundColor: '#F3F4FF',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 26,
    color: '#3A3A3A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3A3A3A',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalButtons: {
    width: '100%',
  },
  allowButton: {
    backgroundColor: '#3E4EF0',
    borderRadius: 50,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  allowButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#fff',
  },
  declineButton: {
    marginTop: 8,
    // backgroundColor: '#fff',
    // borderRadius: 50,
    // paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // borderWidth: 2,
    // borderColor: '#3E4EF0',
  },
  declineButtonText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3E4EF0',
  },
});

