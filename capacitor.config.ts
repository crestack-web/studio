import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.busmo.app',
  appName: 'Busmo',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      signingType: 'apksigner'
    }
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#5717ee',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      spinnerColor: '#ffffff'
    },
    PushNotifications: {
      presentationOptions: {
        notification: {
          title: 'Busmo',
          body: 'You have a new notification',
          sound: 'default'
        }
      }
    }
  }
};

export default config;
