import 'react-native-gesture-handler';
import '@expo/metro-runtime';
import { Platform } from 'react-native';
import { registerRootComponent } from 'expo';
import App from './App';

if (Platform.OS !== 'web') {
  void import('expo-notifications').then((Notifications) => {
    Notifications.setNotificationHandler({
      handleNotification: async () => {
        const { AppState } = await import('react-native');
        const foreground = AppState.currentState === 'active';
        return {
          shouldShowAlert: !foreground,
          shouldPlaySound: !foreground,
          shouldSetBadge: true,
          shouldShowBanner: !foreground,
          shouldShowList: true,
        };
      },
    });
  });
}

registerRootComponent(App);
