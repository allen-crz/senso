
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.090616024393480abf60e623dc6407d3',
  appName: 'senso',
  webDir: 'dist',
  server: {
    url: 'https://09061602-4393-480a-bf60-e623dc6407d3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      keystorePassword: null,
      keystoreAliasPassword: null,
    }
  }
};

export default config;
