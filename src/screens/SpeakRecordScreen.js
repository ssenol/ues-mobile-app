import { Audio } from "expo-av";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../components/Icon";
import speakService from "../services/speak";
import { selectCurrentUser } from "../store/slices/authSlice";
import { setSpeakResults } from "../store/slices/speakSlice";
import colors from "../styles/colors";
import { cleanHtmlAndBreaks } from "../utils/helpers";

const SpeakRecordScreen = ({ route, navigation }) => {
  const {
    taskId,
    questionId,
    quizName,
    speechData,
    taskDetails,
    taskType,
    questionSubDetails,
  } = route.params;

  const [recording, setRecording] = useState(null);
  const [sound, setSound] = useState(null);
  const [recordedUri, setRecordedUri] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState(null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const username = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  useEffect(() => {
    return () => {
      if (recording) {
        stopRecording();
      }
      if (sound) {
        sound.unloadAsync();
        setSound(null);
      }
    };
  }, []);

  useEffect(() => {
    return navigation.addListener("beforeRemove", (e) => {
      if (isRecording) {
        e.preventDefault();
        stopRecording();
        navigation.dispatch(e.data.action);
      }
    });
  }, [navigation, isRecording]);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.error("Error configuring audio:", err);
      }
    };
    configureAudio();
  }, []);

  useEffect(() => {}, [recordedUri]);

  useEffect(() => {
    if (pendingSubmit && recordedUri) {
      setPendingSubmit(false);
      handleSubmit();
    }
  }, [recordedUri, pendingSubmit]);

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      const recordingOptions = {
        android: {
          extension: ".m4a",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
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
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      const interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
      recording.setOnRecordingStatusUpdate((status) => {
        if (!status.isRecording) {
          clearInterval(interval);
        }
      });
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) {
        throw new Error("Ses kaydı URI alınamadı");
      }
      Alert.alert("Record", "Do you want to send the audio recording?", [
        {
          text: "No",
          style: "cancel",
          onPress: () => setRecordedUri(uri),
        },
        {
          text: "Yes",
          onPress: () => {
            setPendingSubmit(true);
            setRecordedUri(uri);
          },
        },
      ]);
      setRecording(null);
      setIsRecording(false);
    } catch (err) {
      console.error("Error stopping recording:", err);
      Alert.alert("Error", "Recording could not be stopped");
      setRecordedUri(null);
    }
  };

  const playSound = async () => {
    try {
      if (isPlaying) {
        if (sound) {
          await sound.stopAsync();
          await sound.unloadAsync();
          setSound(null);
        }
        setIsPlaying(false);
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedUri },
        {
          shouldPlay: true,
          volume: 1.0,
          isMuted: false,
          isLooping: false,
          progressUpdateIntervalMillis: 100,
        },
        null,
        true
      );
      if (Platform.OS === "ios") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      }
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          newSound.unloadAsync();
          setSound(null);
        }
      });
    } catch (err) {
      console.error("Error playing sound:", err);
      setIsPlaying(false);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      Alert.alert("Error", "Failed to playback recording");
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    if (!recordedUri) {
      Alert.alert('Uyarı', 'Ses kaydı bulunamadı. Lütfen tekrar kayıt yapmayı deneyin.');
      setIsLoading(false);
      setError('Ses kaydı URI mevcut değil.');
      return;
    }
    try {
      const uesId = username?.id;
      const audioFile = Platform.OS === 'ios' ? recordedUri : recordedUri?.replace('file://', '');
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
      const response = await speakService.evaluateSpeechMobileTask(paramsForAPI);
      if (response?.status_code !== 200) {
        throw new Error('Speech evaluation failed');
      }
      dispatch(setSpeakResults({ speechResults: response.data }));
      navigation.navigate('SpeakReport', {
        taskId,
        speechResults: response.data,
        quizName,
        speechData,
        taskDetails,
        taskType,
        questionSubDetails
      });
    } catch (error) {
      setError(error.message);
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
            <Text style={styles.speakText}>{cleanHtmlAndBreaks(speechData)}</Text>
          </ScrollView>
        ) : (
          <Text style={styles.speakText}>{cleanHtmlAndBreaks(speechData)}</Text>
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
              * Suggested speak details:{"\n"}
            </Text>
            <Text>
              {taskDetails.duration} seconds, {taskDetails.wordCount} words, {taskDetails.sentenceCount} sentences.
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
  speakText: {
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
  },
  recordInfoText: {
    fontSize: 12,
    color: colors.primary,
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

export default SpeakRecordScreen;
