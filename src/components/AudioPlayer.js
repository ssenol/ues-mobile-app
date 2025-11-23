import { useAudioPlayer } from 'expo-audio';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedIcon from './ThemedIcon';
import { ThemedText } from './ThemedText';

export default function AudioPlayer({ audioUri, duration, onError }) {
  const player = useAudioPlayer(audioUri);
  const [audioWaveformIndex, setAudioWaveformIndex] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState([]);
  const audioWaveformIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const [isComponentMounted, setIsComponentMounted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef(null);

  // Generate random heights for waveform bars
  const generateRandomHeights = () => {
    const heights = [];
    for (let i = 0; i < 20; i++) {
      heights.push(Math.random() * 24 + 8); // 8-32px arası random yükseklik
    }
    return heights;
  };

  // Initialize waveform heights
  useEffect(() => {
    setWaveformHeights(generateRandomHeights());
  }, []);

  // Get waveform height
  const getWaveformHeight = (index) => {
    return waveformHeights[index] || 16;
  };

  // Format duration
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Stop audio (timer'dan önce tanımlanmalı)
  const stopAudio = useCallback(async () => {
    if (!isComponentMounted) return;
    try {
      await player.pause();
      await player.seekTo(0);
      setAudioWaveformIndex(0);
      setCurrentPosition(0);
      setIsPlaying(false);
      setIsLoading(false);
      startTimeRef.current = null; // Timer'ı sıfırla
    } catch (error) {
      console.error('Error stopping audio:', error);
    }
  }, [isComponentMounted, player]);

  // Timer update interval - Manuel timer kullan (player.currentTime reactive değil)
  useEffect(() => {
    if (isPlaying) {
      // Eğer startTime yoksa, şimdiki zamandan başlat
      // Eğer pause'dan sonra resume ise, mevcut pozisyondan devam et
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (currentPosition * 1000);
      }
      
      timerIntervalRef.current = setInterval(() => {
        // Manuel olarak süreyi hesapla
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const newPosition = Math.floor(elapsed);
        
        setCurrentPosition(newPosition);
        
        // Otomatik stop kontrolü
        const totalDuration = duration || Math.floor((player.duration || 0) / 1000);
        if (totalDuration > 0 && newPosition >= totalDuration) {
          stopAudio();
          return;
        }
      }, 100); // Her 100ms'de bir güncelle
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      // Pause yapıldığında startTime'ı sıfırlama, resume için sakla
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [isPlaying, duration, stopAudio]);

  // Audio waveform animation
  useEffect(() => {
    if (isPlaying) {
      // Sabit hız kullan (150ms) - daha smooth animasyon
      audioWaveformIntervalRef.current = setInterval(() => {
        setAudioWaveformIndex((prev) => {
          const next = (prev + 1) % 20;
          if (next === 0) {
            setWaveformHeights(generateRandomHeights());
          }
          return next;
        });
      }, 150); // Sabit 150ms
    } else {
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
      }
    }

    return () => {
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
      }
    };
  }, [isPlaying]);

  // Play audio
  const playAudio = async () => {
    try {
      setIsLoading(true);
      // Player'ın hazır olmasını bekle
      await player.play();
      
      // Timer'ı başlat (eğer resume ise mevcut pozisyondan devam et)
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - (currentPosition * 1000);
      }
      
      setIsPlaying(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
      if (onError) {
        onError(error);
      }
    }
  };

  // Pause audio
  const pauseAudio = async () => {
    if (!isComponentMounted) return;
    try {
      await player.pause();
      
      // Pause yapıldığında mevcut pozisyonu kaydet
      // Böylece resume yapıldığında doğru yerden devam eder
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setCurrentPosition(Math.floor(elapsed));
        startTimeRef.current = null; // Timer'ı durdur
      }
      
      setIsPlaying(false);
      setIsLoading(false); // Pause sonrası loading'i temizle
    } catch (error) {
      console.error('Error pausing audio:', error);
      setIsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    setIsComponentMounted(true);
    return () => {
      setIsComponentMounted(false);
      if (audioWaveformIntervalRef.current) {
        clearInterval(audioWaveformIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      // Don't call pause on unmount to avoid error
      try {
        player.pause().catch(() => {});
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []);

  const totalDuration = duration || Math.floor((player.duration || 0) / 1000);

  return (
    <View style={styles.audioPlayerContainer}>
      {/* Play/Pause Button */}
      <TouchableOpacity
        style={styles.playPauseButton}
        activeOpacity={0.8}
        onPress={() => {
          if (isPlaying) {
            pauseAudio();
          } else {
            playAudio();
          }
        }}
        disabled={isLoading}
      >
        <ThemedIcon
          iconName={isLoading ? 'play' : (isPlaying ? 'pause' : 'play')}
          size={24}
          tintColor="#fff"
        />
      </TouchableOpacity>

      {/* Stop Button */}
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
              isPlaying && i === audioWaveformIndex && styles.audioWaveformBarActive
            ]}
          />
        ))}
      </View>

      {/* Timer */}
      <ThemedText style={styles.audioTimerText}>
        {formatTimer(currentPosition)} / {formatTimer(totalDuration)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  audioPlayerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7E9FF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
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
    borderRadius: 3,
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
});

