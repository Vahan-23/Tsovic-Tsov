require('dotenv').config();

const appJson = require('./app.json');

module.exports = {
  expo: {
    ...appJson.expo,
    plugins: [...(appJson.expo.plugins || []), 'expo-asset'],
    extra: {
      ...(appJson.expo.extra || {}),
      yandexApiKey: process.env.YANDEX_API_KEY || '',
    },
  },
};
