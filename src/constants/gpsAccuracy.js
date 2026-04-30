import { Platform } from 'react-native';
import * as Location from 'expo-location';

/** Foreground‑максимум: быстрее расходует батарею, ниже ошибка координат (на улице чаще 3–15 м). */
export const POSITION_MAX_ACCURACY = {
  accuracy: Location.Accuracy.BestForNavigation,
  ...(Platform.OS === 'android' ? { mayShowUserSettingsDialog: true } : {}),
};

/** Непрерывное слежение на экране навигации. */
export const WATCH_NAVIGATION = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 750,
  distanceInterval: 1,
};

/** Карта в модалке после поиска — чуть реже обновление, чтобы не разогреть CPU. */
export const WATCH_MODAL_MAP = {
  accuracy: Location.Accuracy.BestForNavigation,
  timeInterval: 1000,
  distanceInterval: 1,
};
