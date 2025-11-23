import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { logout as logoutAction } from "../store/slices/authSlice";

/**
 * Ortak logout fonksiyonu. Navigasyon parametresi opsiyoneldir.
 * @param {object} options
 * @param {function} options.dispatch - Redux dispatch fonksiyonu
 * @param {object} [options.navigation] - Navigation nesnesi (isteğe bağlı)
 */
export async function handleLogout({ dispatch, navigation }) {
  Alert.alert("Logout", "Are you sure you want to log out?", [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Logout",
      style: "destructive",
      onPress: async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          dispatch(logoutAction());
        } catch (error) {
          console.log("Logout error:", error);
          dispatch(logoutAction());
        } finally {
          // Navigasyon ile yönlendirme kaldırıldı. Çünkü AppNavigator zaten isAuthenticated'a göre Login ekranını gösteriyor.
        }
      },
    },
  ]);
}
