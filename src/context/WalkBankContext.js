import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bindForegroundWalkTracking } from '../services/walkTracking';
import {
  getRemoteUnlockCostMeters,
  isWithinFreeUnlockRadius,
  MAX_DAILY_EARN_METERS,
  MIN_BANK_SPEND_METERS,
  TEST_WALK_GRANT_METERS,
} from '../constants/walkBank';
import { haversineDistanceMeters } from '../utils/haversine';
import { useFigures } from './FiguresContext';

const STORAGE_BANK_KEY = '@tsovic_tsov/walk_bank_meters';
const STORAGE_DAY_KEY = '@tsovic_tsov/walk_bank_day';
const STORAGE_TODAY_EARNED_KEY = '@tsovic_tsov/walk_bank_today_earned';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

const WalkBankContext = createContext(null);

export function WalkBankProvider({ children }) {
  const { unlockById } = useFigures();
  const [walkBankMeters, setWalkBankMeters] = useState(0);
  const [todayEarnedMeters, setTodayEarnedMeters] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const persistRef = useRef({ bank: 0, day: todayKey(), todayEarned: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [[, bankRaw], [, dayRaw], [, earnedRaw]] =
          await AsyncStorage.multiGet([
            STORAGE_BANK_KEY,
            STORAGE_DAY_KEY,
            STORAGE_TODAY_EARNED_KEY,
          ]);
        if (cancelled) return;
        const day = todayKey();
        let bank = Math.max(0, Math.round(Number(bankRaw) || 0));
        let todayEarned = Math.max(0, Math.round(Number(earnedRaw) || 0));
        if (dayRaw !== day) {
          todayEarned = 0;
        }
        persistRef.current = { bank, day, todayEarned };
        setWalkBankMeters(bank);
        setTodayEarnedMeters(todayEarned);
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(async () => {
    const { bank, day, todayEarned } = persistRef.current;
    try {
      await AsyncStorage.multiSet([
        [STORAGE_BANK_KEY, String(bank)],
        [STORAGE_DAY_KEY, day],
        [STORAGE_TODAY_EARNED_KEY, String(todayEarned)],
      ]);
    } catch {
      /* ignore */
    }
  }, []);

  const creditMeters = useCallback(
    (delta) => {
      const d = Math.round(Number(delta) || 0);
      if (d <= 0) return;

      const day = todayKey();
      let { bank, todayEarned } = persistRef.current;
      if (persistRef.current.day !== day) {
        todayEarned = 0;
        persistRef.current.day = day;
      }

      const room = Math.max(0, MAX_DAILY_EARN_METERS - todayEarned);
      const credited = Math.min(d, room);
      if (credited <= 0) return;

      bank += credited;
      todayEarned += credited;
      persistRef.current = { bank, day, todayEarned };
      setWalkBankMeters(bank);
      setTodayEarnedMeters(todayEarned);
      void persist();
    },
    [persist]
  );

  useEffect(() => {
    if (!loaded) return undefined;
    return bindForegroundWalkTracking(creditMeters);
  }, [loaded, creditMeters]);

  const spendMeters = useCallback(
    (amount) => {
      const cost = Math.round(Number(amount) || 0);
      if (cost < MIN_BANK_SPEND_METERS) {
        return { ok: false, reason: 'too_small' };
      }
      const bank = persistRef.current.bank;
      if (bank < cost) {
        return { ok: false, reason: 'insufficient', need: cost, have: bank };
      }
      const next = bank - cost;
      persistRef.current = { ...persistRef.current, bank: next };
      setWalkBankMeters(next);
      void persist();
      return { ok: true, spent: cost, remaining: next };
    },
    [persist]
  );

  const getCrowMeters = useCallback((from, toLat, toLon) => {
    if (!from || !Number.isFinite(toLat) || !Number.isFinite(toLon)) {
      return null;
    }
    return Math.round(
      haversineDistanceMeters(from, { latitude: toLat, longitude: toLon })
    );
  }, []);

  const unlockStatueWithBank = useCallback(
    (figure, userCoords) => {
      if (!figure || figure.unlocked) {
        return { ok: false, reason: 'already' };
      }
      const crow = getCrowMeters(
        userCoords,
        figure.latitude,
        figure.longitude
      );
      if (crow == null) {
        return { ok: false, reason: 'no_location' };
      }
      if (isWithinFreeUnlockRadius(crow)) {
        return { ok: false, reason: 'nearby_free', crow };
      }
      const cost = getRemoteUnlockCostMeters(crow);
      const spend = spendMeters(cost);
      if (!spend.ok) {
        return { ...spend, cost, crow };
      }
      const unlock = unlockById(figure.id);
      if (!unlock.ok) {
        creditMeters(spend.spent);
        return { ok: false, reason: 'unlock_failed', cost };
      }
      return {
        ok: true,
        cost,
        crow,
        spent: spend.spent,
        remaining: spend.remaining,
        alreadyHad: unlock.alreadyHad,
      };
    },
    [getCrowMeters, spendMeters, unlockById, creditMeters]
  );

  const resetWalkBank = useCallback(async () => {
    const day = todayKey();
    persistRef.current = { bank: 0, day, todayEarned: 0 };
    setWalkBankMeters(0);
    setTodayEarnedMeters(0);
    await persist();
  }, [persist]);

  /** Test top-up — bypasses daily earn cap (for QA only). */
  const grantTestWalkMeters = useCallback(
    (amount = TEST_WALK_GRANT_METERS) => {
      const d = Math.max(0, Math.round(Number(amount) || 0));
      if (d <= 0) return 0;
      const { day, todayEarned } = persistRef.current;
      const bank = persistRef.current.bank + d;
      persistRef.current = { bank, day, todayEarned };
      setWalkBankMeters(bank);
      void persist();
      return bank;
    },
    [persist]
  );

  const value = useMemo(
    () => ({
      loaded,
      walkBankMeters,
      todayEarnedMeters,
      dailyCapMeters: MAX_DAILY_EARN_METERS,
      creditMeters,
      spendMeters,
      getCrowMeters,
      getRemoteUnlockCostMeters,
      isWithinFreeUnlockRadius,
      unlockStatueWithBank,
      resetWalkBank,
      grantTestWalkMeters,
      canAffordCost: (cost) =>
        persistRef.current.bank >= Math.round(Number(cost) || 0),
    }),
    [
      loaded,
      walkBankMeters,
      todayEarnedMeters,
      creditMeters,
      spendMeters,
      getCrowMeters,
      unlockStatueWithBank,
      resetWalkBank,
      grantTestWalkMeters,
    ]
  );

  return (
    <WalkBankContext.Provider value={value}>{children}</WalkBankContext.Provider>
  );
}

export function useWalkBank() {
  const ctx = useContext(WalkBankContext);
  if (!ctx) {
    throw new Error('useWalkBank must be used within WalkBankProvider');
  }
  return ctx;
}
