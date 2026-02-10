import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isTablet = SCREEN_WIDTH >= 744;

const Banner = ({ 
  type,
  solvedCount = 0,
  containerStyle,
  children 
}) => {

  // Banner konfigürasyonları
  const bannerConfig = {
    home: {
      background: isTablet 
        ? require('../../assets/images/banners/tablet/bg-yellow.png')
        : require('../../assets/images/banners/phone/bg-yellow.png'),
      image: require('../../assets/images/banners/student1.png'),
    },
    assignmentsZero: {
      background: isTablet 
        ? require('../../assets/images/banners/tablet/bg-blue.png')
        : require('../../assets/images/banners/phone/bg-blue.png'),
      image: require('../../assets/images/banners/student4.png'),
    },
    assignmentsProgress: {
      background: isTablet 
        ? require('../../assets/images/banners/tablet/bg-blue.png')
        : require('../../assets/images/banners/phone/bg-blue.png'),
      image: require('../../assets/images/banners/student2.png'),
    }
  };

  // Banner tipini belirle
  let bannerType;
  if (type === 'home') {
    bannerType = 'home';
  } else if (type === 'assignments') {
    bannerType = solvedCount === 0 ? 'assignmentsZero' : 'assignmentsProgress';
  }

  const config = bannerConfig[bannerType];
  if (!config) return null;

  // Boyutlar
  const bannerWidth = SCREEN_WIDTH - 32; // 16px padding sağ + sol
  const backgroundHeight = bannerWidth / (isTablet ? 778/164 : 343/118); // zemin oranı
  const bannerHeight = backgroundHeight + (bannerWidth * (isTablet ? 10/778 : 10/343)); // zemin + 10px
  const imageWidth = bannerWidth * (isTablet ? 177/778 : 150/343) - 10; // banner genişliğine göre oran
  const imageHeight = bannerHeight - 10; // görsel banner yüksekliği kadar
  const textPadding = isTablet ? 24 : 8;

  // Tablet için özel oran düzeltmeleri - istenen ölçüler
  const tabletImageWidth = bannerWidth * (204/778) - 10; // 204/778 oranı
  const tabletImageHeight = bannerHeight - 10; // banner ile aynı yükseklik

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.banner, { width: bannerWidth, height: bannerHeight }]}>
        {/* Zemin Görseli - Alta Hizalı */}
        <ImageBackground
          source={config.background}
          style={[styles.backgroundImage, { 
            width: bannerWidth, 
            height: bannerHeight, // banner yüksekliği kadar
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0
          }]}
          resizeMode="cover"
        />
        
        <View style={styles.content}>
          {/* Sol Görsel */}
          <View style={[styles.imageContainer, { 
            width: isTablet ? tabletImageWidth : imageWidth, 
            height: isTablet ? tabletImageHeight : imageHeight,
            position: 'absolute',
            left: isTablet ? 30 : 0,
            bottom: 0, // alta hizalı
            zIndex: 1
          }]}>
            <ImageBackground
              source={config.image}
              style={styles.studentImage}
              resizeMode="contain"
            />
          </View>

          {/* Sağ Metin Alanı */}
          <View style={[styles.textContainer, { 
            paddingLeft: textPadding + (isTablet ? tabletImageWidth + 40 : imageWidth),
            height: bannerHeight,
            zIndex: 2
          }]}>
            {children}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  banner: {
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 12,
  },
  backgroundImage: {
    borderRadius: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  imageContainer: {
    overflow: 'visible',
  },
  studentImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    textAlign: 'left',
  },
  titlePhone: {
    fontSize: 16,
    lineHeight: 22,
  },
  titleTablet: {
    fontSize: 28,
    lineHeight: 36,
  },
  subtitle: {
    textAlign: 'left',
    marginTop: 4,
  },
  subtitlePhone: {
    fontSize: 12,
    lineHeight: 18,
  },
  subtitleTablet: {
    fontSize: 20,
    lineHeight: 28,
  },
});

export default Banner;
