import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibed.app',
  appName: 'Vibed',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: {
        location: {
          description: 'Este app precisa da sua localização para mostrar eventos próximos a você.'
        }
      }
    }
  }
};

export default config;

