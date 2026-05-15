import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { haversineDistanceMeters } from '../utils/haversine';
import {
  MAX_GPS_ACCURACY_METERS,
  MAX_GPS_JUMP_METERS,
  MAX_WALK_SPEED_MPS,
  MIN_GPS_SEGMENT_METERS,
  MIN_WALK_SPEED_MPS,
  METERS_PER_STEP,
  PEDOMETER_MAX_STEPS_PER_TICK,
  PEDOMETER_MIN_STEPS_BATCH,
  STATIONARY_BREAKOUT_METERS,
  STATIONARY_MS,
} from '../constants/walkBank';

const WATCH_OPTS = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 12,
};

/**
 * Foreground walk tracking — pedometer preferred; GPS only if no pedometer.
 * Stationary filter stops GPS drift while sitting.
 */
export async function startWalkTracking({ onMeters }) {
  let lastGps = null;
  let lastGpsTime = 0;
  let lastStepCount = null;
  let pendingSteps = 0;
  let pedometerSub = null;
  let locationSub = null;
  let useGpsEarning = true;
  let stopped = false;

  let anchor = null;
  let anchorSince = 0;
  let stationary = false;

  const grant = await Location.requestForegroundPermissionsAsync();
  if (grant.status !== 'granted') {
    return () => {};
  }

  const addMeters = (delta) => {
    const d = Math.round(Number(delta) || 0);
    if (d > 0) onMeters(d);
  };

  const updateStationary = (pt, now) => {
    if (!anchor) {
      anchor = pt;
      anchorSince = now;
      stationary = false;
      return;
    }
    const fromAnchor = haversineDistanceMeters(anchor, pt);
    if (stationary) {
      if (fromAnchor >= STATIONARY_BREAKOUT_METERS) {
        stationary = false;
        anchor = pt;
        anchorSince = now;
      }
      return;
    }
    if (fromAnchor < STATIONARY_BREAKOUT_METERS * 0.45) {
      if (now - anchorSince >= STATIONARY_MS) {
        stationary = true;
      }
    } else {
      anchor = pt;
      anchorSince = now;
    }
  };

  const onGps = (fix) => {
    if (!useGpsEarning) return;

    const lat = fix.coords.latitude;
    const lon = fix.coords.longitude;
    const accuracy = fix.coords.accuracy;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    if (Number.isFinite(accuracy) && accuracy > MAX_GPS_ACCURACY_METERS) {
      return;
    }

    const now =
      typeof fix.timestamp === 'number' ? fix.timestamp : Date.now();
    const pt = { latitude: lat, longitude: lon };

    updateStationary(pt, now);
    if (stationary) {
      lastGps = pt;
      lastGpsTime = now;
      return;
    }

    if (lastGps) {
      const dist = haversineDistanceMeters(lastGps, pt);
      const dtSec = Math.max(0.5, (now - lastGpsTime) / 1000);
      const speed = dist / dtSec;
      if (
        dist >= MIN_GPS_SEGMENT_METERS &&
        dist <= MAX_GPS_JUMP_METERS &&
        speed >= MIN_WALK_SPEED_MPS &&
        speed <= MAX_WALK_SPEED_MPS
      ) {
        addMeters(dist);
        anchor = pt;
        anchorSince = now;
        stationary = false;
      }
    }

    lastGps = pt;
    lastGpsTime = now;
  };

  try {
    const available = await Pedometer.isAvailableAsync();
    if (available) {
      const perm = await Pedometer.requestPermissionsAsync();
      if (perm.granted) {
        useGpsEarning = false;
        pedometerSub = Pedometer.watchStepCount((result) => {
          const steps = result?.steps;
          if (!Number.isFinite(steps)) return;
          if (lastStepCount == null) {
            lastStepCount = steps;
            return;
          }
          let deltaSteps = steps - lastStepCount;
          lastStepCount = steps;
          if (deltaSteps <= 0) return;
          if (deltaSteps > PEDOMETER_MAX_STEPS_PER_TICK) return;

          pendingSteps += deltaSteps;
          if (pendingSteps >= PEDOMETER_MIN_STEPS_BATCH) {
            addMeters(pendingSteps * METERS_PER_STEP);
            pendingSteps = 0;
          }
        });
      }
    }
  } catch {
    useGpsEarning = true;
  }

  if (useGpsEarning) {
    try {
      locationSub = await Location.watchPositionAsync(WATCH_OPTS, onGps);
    } catch {
      locationSub = null;
    }
  }

  return () => {
    if (stopped) return;
    stopped = true;
    if (locationSub) locationSub.remove();
    if (pedometerSub) pedometerSub.remove();
  };
}

/**
 * Runs walk tracking only while app is in foreground.
 */
export function bindForegroundWalkTracking(onMeters) {
  let cleanup = () => {};
  let starting = false;

  const stop = () => {
    const fn = cleanup;
    cleanup = () => {};
    fn();
  };

  const start = async () => {
    if (starting) return;
    starting = true;
    stop();
    try {
      cleanup = await startWalkTracking({ onMeters });
    } catch {
      cleanup = () => {};
    } finally {
      starting = false;
    }
  };

  const onAppState = (state) => {
    if (state === 'active') {
      void start();
    } else {
      stop();
    }
  };

  const sub = AppState.addEventListener('change', onAppState);
  if (AppState.currentState === 'active') {
    void start();
  }

  return () => {
    sub.remove();
    stop();
  };
}
