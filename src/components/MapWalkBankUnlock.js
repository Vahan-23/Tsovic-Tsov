import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { POSITION_MAX_ACCURACY } from '../constants/gpsAccuracy';
import { UNLOCK_RADIUS_METERS } from '../constants/unlockRadius';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useWalkBank } from '../context/WalkBankContext';
import { formatWalkDistance } from '../utils/formatWalkDistance';

/**
 * Remote unlock block inside map bottom sheet.
 */
export default function MapWalkBankUnlock({
  figure,
  crowMeters,
  onUnlocked,
}) {
  const { t } = useLanguage();
  const { colors } = useSettings();
  const {
    walkBankMeters,
    getRemoteUnlockCostMeters,
    isWithinFreeUnlockRadius,
    unlockStatueWithBank,
  } = useWalkBank();

  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState(null);

  const cost =
    crowMeters != null ? getRemoteUnlockCostMeters(crowMeters) : null;
  const nearbyFree =
    crowMeters != null && isWithinFreeUnlockRadius(crowMeters);
  const canAfford = cost != null && walkBankMeters >= cost;
  const progress = cost != null && cost > 0 ? Math.min(1, walkBankMeters / cost) : 0;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          marginBottom: 12,
          padding: 12,
          borderRadius: 14,
          backgroundColor:
            colors.bgSubtle ?? 'rgba(15,23,42,0.06)',
          borderWidth: 1,
          borderColor: colors.border,
        },
        bankRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        },
        bankLabel: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.textSecondary,
        },
        bankValue: {
          fontSize: 15,
          fontWeight: '800',
          color: '#C9A020',
        },
        track: {
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.bgMuted,
          overflow: 'hidden',
          marginBottom: 8,
        },
        fill: {
          height: '100%',
          borderRadius: 4,
          backgroundColor: canAfford ? '#16A34A' : '#C9A020',
        },
        costLine: {
          fontSize: 13,
          color: colors.textSecondary,
          marginBottom: 10,
        },
        nearby: {
          fontSize: 13,
          color: '#4ADE80',
          lineHeight: 18,
          marginBottom: 4,
        },
        err: {
          fontSize: 12,
          color: '#F87171',
          marginBottom: 8,
        },
        btn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 13,
          borderRadius: 12,
          backgroundColor: canAfford ? colors.primary : colors.bgMuted,
        },
        btnDisabled: {
          opacity: 0.85,
        },
        btnText: {
          fontSize: 15,
          fontWeight: '700',
          color: canAfford ? '#FFFFFF' : colors.textMuted,
        },
        needMore: {
          fontSize: 12,
          color: colors.textMuted,
          marginTop: 8,
          textAlign: 'center',
        },
      }),
    [colors, canAfford]
  );

  if (!figure || figure.unlocked) return null;

  const onPressUnlock = async () => {
    if (busy || nearbyFree || cost == null || !canAfford) return;
    setBusy(true);
    setErrorKey(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorKey('permission');
        return;
      }
      const loc = await Location.getCurrentPositionAsync(POSITION_MAX_ACCURACY);
      const result = unlockStatueWithBank(figure, {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (result.ok) {
        onUnlocked?.(result);
        return;
      }
      if (result.reason === 'insufficient') {
        setErrorKey('insufficient');
      } else if (result.reason === 'nearby_free') {
        setErrorKey('nearby');
      } else {
        setErrorKey('failed');
      }
    } catch {
      setErrorKey('failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bankRow}>
        <Text style={styles.bankLabel}>{t('walkBankYourBalance')}</Text>
        <Text style={styles.bankValue}>
          {formatWalkDistance(walkBankMeters, t)}
        </Text>
      </View>

      {nearbyFree ? (
        <Text style={styles.nearby}>
          {t('mapRouteNearbyUnlock', { n: UNLOCK_RADIUS_METERS })}
        </Text>
      ) : cost != null && cost > 0 ? (
        <>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.costLine}>
            {t('walkBankUnlockCost', { cost: formatWalkDistance(cost, t) })}
          </Text>
          {errorKey === 'insufficient' ? (
            <Text style={styles.err}>{t('walkBankInsufficient')}</Text>
          ) : null}
          {errorKey === 'permission' ? (
            <Text style={styles.err}>{t('permissionMessage')}</Text>
          ) : null}
          {errorKey === 'failed' ? (
            <Text style={styles.err}>{t('walkBankUnlockFailed')}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={!canAfford || busy}
            style={({ pressed }) => [
              styles.btn,
              (!canAfford || busy) && styles.btnDisabled,
              pressed && canAfford && { opacity: 0.9 },
            ]}
            onPress={() => void onPressUnlock()}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons
                name="footsteps"
                size={18}
                color={canAfford ? '#FFFFFF' : colors.textMuted}
              />
            )}
            <Text style={styles.btnText}>
              {canAfford
                ? t('walkBankUnlockCta', {
                    cost: formatWalkDistance(cost, t),
                  })
                : t('walkBankUnlockCtaDisabled')}
            </Text>
          </Pressable>
          {!canAfford && cost != null ? (
            <Text style={styles.needMore}>
              {t('walkBankNeedMore', {
                n: formatWalkDistance(Math.max(0, cost - walkBankMeters), t),
              })}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
