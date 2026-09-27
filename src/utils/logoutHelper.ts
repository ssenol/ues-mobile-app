import * as Haptics from "expo-haptics";
import { Alert } from "react-native";
import { logout as logoutAction } from "../store/slices/authSlice";
import { clearAssignmentState } from "../store/slices/assignmentSlice";
import type { AppDispatch } from "../store";

interface LogoutOptions {
  dispatch: AppDispatch;
  navigation?: unknown;
}

// Ortak logout fonksiyonu: assignment cache'ini ve auth state'ini temizler
export async function performLogout({ dispatch }: LogoutOptions): Promise<void> {
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

export async function handleLogout({ dispatch }: LogoutOptions): Promise<void> {
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
