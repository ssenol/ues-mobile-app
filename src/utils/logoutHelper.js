import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { logout as logoutAction } from "../store/slices/authSlice";
import { clearAssignmentState } from "../store/slices/assignmentSlice";

/**
 * Ortak logout fonksiyonu. Navigasyon parametresi opsiyoneldir.
 * @param {object} options
 * @param {function} options.dispatch - Redux dispatch fonksiyonu
 * @param {object} [options.navigation] - Navigation nesnesi (isteğe bağlı)
 */
export async function performLogout({ dispatch }) {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.log("Logout haptics error:", error);
  } finally {
    // Assignment cache'ini temizle
    dispatch(clearAssignmentState());
    // Auth state'ini temizle
    dispatch(logoutAction());
  }
}

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
        await performLogout({ dispatch });
      },
    },
  ]);
}
