import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.foodflow.app',
  appName: 'fooodflow-project',
  webDir: 'src',
  server: {
  url: "https://foodflow-0-5.vercel.app/",
  cleartext: true
    
  }
};

export default config;
