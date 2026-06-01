import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import LoginScreen from '../../src/screens/LoginScreen';
import { selectIsAuthenticated } from '@/src/store/slices/authSlice';

export default function Login() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <LoginScreen />;
}
