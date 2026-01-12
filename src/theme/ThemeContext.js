import React, { createContext, useContext } from 'react';

const ThemeContext = createContext();

export const theme = {
  fonts: {
    regular: 'Nunito_400Regular',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
    black: 'Nunito_900Black',
  },
  colors: {
    primary: '#3E4EF0',
    red: '#cc0000',
    // secondary: '#cc0000',
    text: '#3a3a3a', // default font rengi
    background: '#ffffff',
    white: '#ffffff',
    black: '#000000',
    border: '#cccccc',
    placeholder: '#969696',
    color555: '#555',
    // Goal Progress renkleri
    goalGreen: '#34C759',
    goalOrange: '#FF9500',
    goalRed: '#FF3B30',
    goalBackgroundGreen: '#EAFFEF',
    goalBackgroundOrange: '#FFF5EA',
    goalBackgroundRed: '#FFEFEE',
    // Score renkleri (Completed screen için)
    scoreGreen: '#34C759',
    scoreOrange: '#FF9500',
    scoreRed: '#FF3B30',
    scoreBorderGreen: '#C0F8CE',
    scoreBorderOrange: '#FFE5C0',
    scoreBorderRed: '#FFD3D0',
  },
  shadows: {
    dark: {
      shadowColor: '#3E4EF0',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 12,
    },
    light: {
      shadowColor: '#3E4EF0',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 12,
    },
    sticky: {
      shadowColor: '#3E4EF0',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 12,
    },
  },
};

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);