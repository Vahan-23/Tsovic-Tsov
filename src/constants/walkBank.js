import { UNLOCK_RADIUS_METERS } from './unlockRadius';

/** Average stride length when converting steps → meters. */
export const METERS_PER_STEP = 0.78;

/** Ignore GPS segments faster than ~12 km/h (not walking). */
export const MAX_WALK_SPEED_MPS = 3.4;

/** Minimum walking speed to count GPS (~2.5 km/h). */
export const MIN_WALK_SPEED_MPS = 0.7;

/** Ignore GPS noise jumps larger than this between fixes. */
export const MAX_GPS_JUMP_METERS = 90;

/** Ignore tiny GPS wobble when “standing still”. */
export const MIN_GPS_SEGMENT_METERS = 14;

/** Ignore GPS fixes worse than this (meters). */
export const MAX_GPS_ACCURACY_METERS = 35;

/** After this long within a small radius → treat as stationary (no earn). */
export const STATIONARY_MS = 75_000;

/** Must leave this radius (m) to start earning again. */
export const STATIONARY_BREAKOUT_METERS = 28;

/** Pedometer: credit only after this many new steps in one burst. */
export const PEDOMETER_MIN_STEPS_BATCH = 18;

/** Pedometer: ignore absurd single-tick spikes (cheat / sensor glitch). */
export const PEDOMETER_MAX_STEPS_PER_TICK = 80;

/**
 * Max meters you can earn per calendar day from walking (GPS/steps).
 * Spending from the bank is unlimited; only passive earning is capped.
 */
export const MAX_DAILY_EARN_METERS = 25_000;

/** One tap in menu — test grant (does not count toward daily earn cap). */
export const TEST_WALK_GRANT_METERS = 10_000;

/** Minimum balance to spend on a remote unlock. */
export const MIN_BANK_SPEND_METERS = 50;

/** Remote unlock costs straight-line distance when farther than GPS unlock radius. */
export function getRemoteUnlockCostMeters(crowMeters) {
  const crow = Math.round(Number(crowMeters) || 0);
  if (crow <= UNLOCK_RADIUS_METERS) return 0;
  return crow;
}

export function isWithinFreeUnlockRadius(crowMeters) {
  return getRemoteUnlockCostMeters(crowMeters) === 0;
}
