import React, { useMemo } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SUPPORTED_LOCALES } from '../i18n/strings';
import { useFigures } from '../context/FiguresContext';
import { useWalkBank } from '../context/WalkBankContext';
import { useLanguage } from '../context/LanguageContext';
import {
  useSettings,
  THEME_LIGHT,
  THEME_DARK,
  THEME_SYSTEM,
} from '../context/SettingsContext';

const HISTORY_MODE_TKEY = {
  statues: 'searchModeStatues',
  statues3d: 'searchModeStatues3d',
  pulpulaks: 'searchModePulpulaks',
};

const DRAWER_MAX = 320;
const FLAGS = {
  hy: '🇦🇲',
  ru: '🇷🇺',
  en: '🇬🇧',
};

const THEME_OPTIONS = [
  { id: THEME_LIGHT, labelKey: 'themeLight' },
  { id: THEME_DARK, labelKey: 'themeDark' },
  { id: THEME_SYSTEM, labelKey: 'themeSystem' },
];

export default function MainMenu() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useLanguage();
  const {
    soundsEnabled,
    notificationsEnabled,
    setSoundsEnabled,
    setNotificationsEnabled,
    themePreference,
    setThemePreference,
    colors,
  } = useSettings();
  const { discoveryHistory, resetCollectionProgress } = useFigures();
  const { resetWalkBank, grantTestWalkMeters } = useWalkBank();
  const [open, setOpen] = React.useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        burger: {
          marginRight: 12,
          padding: 6,
          justifyContent: 'center',
          alignItems: 'center',
        },
        burgerPressed: {
          opacity: 0.65,
        },
        overlayRoot: {
          flex: 1,
          flexDirection: 'row',
        },
        drawer: {
          alignSelf: 'stretch',
          backgroundColor: colors.drawerBg,
          borderRightWidth: StyleSheet.hairlineWidth,
          borderRightColor: colors.border,
          flexDirection: 'column',
          shadowColor: colors.shadow,
          shadowOffset: { width: 4, height: 0 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        },
        drawerHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        drawerTitle: {
          fontSize: 20,
          fontWeight: '800',
          color: colors.text,
        },
        closeBtn: {
          padding: 4,
        },
        scroll: {
          flexGrow: 1,
        },
        scrollContent: {
          paddingHorizontal: 16,
          paddingTop: 20,
        },
        sectionLabel: {
          fontSize: 12,
          fontWeight: '800',
          letterSpacing: 0.6,
          color: colors.textMuted,
          textTransform: 'uppercase',
          marginBottom: 10,
        },
        sectionSpaced: {
          marginTop: 28,
        },
        langRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 14,
          paddingHorizontal: 14,
          borderRadius: 12,
          backgroundColor: colors.langRowBg,
          marginBottom: 10,
          borderWidth: 2,
          borderColor: 'transparent',
        },
        langRowActive: {
          backgroundColor: colors.langRowActiveBg,
          borderColor: colors.primary,
        },
        langRowPressed: {
          opacity: 0.9,
        },
        flagEmoji: {
          fontSize: 24,
        },
        langLabel: {
          flex: 1,
          fontSize: 16,
          fontWeight: '700',
          color: colors.iconMuted,
        },
        langLabelActive: {
          color: colors.primaryText,
        },
        langSpacer: {
          width: 22,
          height: 22,
        },
        settingRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingVertical: 14,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderMuted,
        },
        settingTextBlock: {
          flex: 1,
          paddingRight: 8,
        },
        settingTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        settingHint: {
          marginTop: 4,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
        },
        footerNote: {
          marginTop: 20,
          fontSize: 12,
          lineHeight: 17,
          color: colors.textSubtle,
        },
        dangerBlock: {
          marginTop: 6,
          paddingVertical: 14,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: colors.bgMuted,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderMuted,
        },
        dangerTitle: {
          fontSize: 16,
          fontWeight: '700',
          color: colors.text,
        },
        dangerHint: {
          marginTop: 6,
          fontSize: 13,
          lineHeight: 18,
          color: colors.textMuted,
        },
        dangerPressed: {
          opacity: 0.88,
        },
        historyEmpty: {
          fontSize: 14,
          color: colors.textSubtle,
          marginBottom: 8,
        },
        historyRow: {
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 10,
          backgroundColor: colors.historyRowBg,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: colors.borderMuted,
        },
        historyName: {
          fontSize: 14,
          fontWeight: '700',
          color: colors.text,
        },
        historyMeta: {
          marginTop: 4,
          fontSize: 12,
          color: colors.textMuted,
        },
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlay,
        },
      }),
    [colors]
  );

  const drawerWidth = Math.min(
    DRAWER_MAX,
    Dimensions.get('window').width * 0.88
  );

  const close = React.useCallback(() => setOpen(false), []);

  const onResetCollection = React.useCallback(() => {
    Alert.alert(
      t('resetCollectionConfirmTitle'),
      t('resetCollectionConfirmMessage'),
      [
        { text: t('resetCollectionCancel'), style: 'cancel' },
        {
          text: t('resetCollectionConfirmDestructive'),
          style: 'destructive',
          onPress: () => {
            void resetCollectionProgress();
            void resetWalkBank();
            close();
          },
        },
      ]
    );
  }, [close, resetCollectionProgress, resetWalkBank, t]);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.burger, pressed && styles.burgerPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('menuAccessibilityOpen')}
      >
        <Ionicons name="menu" size={26} color={colors.icon} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
        statusBarTranslucent
      >
        <View style={styles.overlayRoot}>
          <View
            style={[
              styles.drawer,
              {
                width: drawerWidth,
                paddingTop: insets.top + 8,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>{t('menuTitle')}</Text>
              <Pressable
                onPress={close}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel={t('menuClose')}
              >
                <Ionicons name="close" size={28} color={colors.iconMuted} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>{t('menuLanguage')}</Text>
              {SUPPORTED_LOCALES.map((code) => {
                const active = locale === code;
                return (
                  <Pressable
                    key={code}
                    onPress={() => setLocale(code)}
                    style={({ pressed }) => [
                      styles.langRow,
                      active && styles.langRowActive,
                      pressed && !active && styles.langRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(`langName_${code}`)}
                  >
                    <Text style={styles.flagEmoji}>{FLAGS[code] ?? '🏳️'}</Text>
                    <Text
                      style={[styles.langLabel, active && styles.langLabelActive]}
                      numberOfLines={1}
                    >
                      {t(`langName_${code}`)}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <View style={styles.langSpacer} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                {t('themeAppearance')}
              </Text>
              {THEME_OPTIONS.map((opt) => {
                const active = themePreference === opt.id;
                return (
                  <Pressable
                    key={opt.id}
                    onPress={() => setThemePreference(opt.id)}
                    style={({ pressed }) => [
                      styles.langRow,
                      active && styles.langRowActive,
                      pressed && !active && styles.langRowPressed,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(opt.labelKey)}
                  >
                    <Text
                      style={[styles.langLabel, active && styles.langLabelActive]}
                      numberOfLines={1}
                    >
                      {t(opt.labelKey)}
                    </Text>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    ) : (
                      <View style={styles.langSpacer} />
                    )}
                  </Pressable>
                );
              })}

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                {t('menuRecentTitle')}
              </Text>
              {discoveryHistory.length === 0 ? (
                <Text style={styles.historyEmpty}>{t('menuRecentEmpty')}</Text>
              ) : (
                discoveryHistory.slice(0, 12).map((e) => (
                  <View
                    key={`${e.mode}-${e.id}-${e.ts}`}
                    style={styles.historyRow}
                  >
                    <Text style={styles.historyName} numberOfLines={2}>
                      {e.name}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {t(HISTORY_MODE_TKEY[e.mode] ?? 'searchModeStatues')} ·{' '}
                      {new Date(e.ts).toLocaleString()}
                    </Text>
                  </View>
                ))
              )}

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                {t('menuSettings')}
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingTextBlock}>
                  <Text style={styles.settingTitle}>{t('settingSounds')}</Text>
                  <Text style={styles.settingHint}>{t('settingSoundsHint')}</Text>
                </View>
                <Switch
                  value={soundsEnabled}
                  onValueChange={setSoundsEnabled}
                  trackColor={{
                    false: colors.switchTrackOff,
                    true: colors.switchTrackOn,
                  }}
                  thumbColor={
                    soundsEnabled ? colors.switchThumbOn : colors.switchThumbOff
                  }
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextBlock}>
                  <Text style={styles.settingTitle}>{t('settingNotifications')}</Text>
                  <Text style={styles.settingHint}>{t('settingNotificationsHint')}</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: colors.switchTrackOff,
                    true: colors.switchTrackOn,
                  }}
                  thumbColor={
                    notificationsEnabled
                      ? colors.switchThumbOn
                      : colors.switchThumbOff
                  }
                />
              </View>

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                {t('settingsDataSection')}
              </Text>
              <Pressable
                onPress={() => {
                  grantTestWalkMeters();
                  Alert.alert(t('walkBankTestGrantDoneTitle'), t('walkBankTestGrantDoneMessage'));
                }}
                style={({ pressed }) => [
                  styles.langRow,
                  pressed && styles.langRowPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('walkBankTestGrant')}
              >
                <Ionicons name="footsteps" size={22} color="#C9A020" />
                <View style={[styles.settingTextBlock, { flex: 1 }]}>
                  <Text style={styles.settingTitle}>{t('walkBankTestGrant')}</Text>
                  <Text style={styles.settingHint}>{t('walkBankTestGrantHint')}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={onResetCollection}
                style={({ pressed }) => [
                  styles.dangerBlock,
                  pressed && styles.dangerPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('settingResetCollection')}
              >
                <Text style={styles.dangerTitle}>{t('settingResetCollection')}</Text>
                <Text style={styles.dangerHint}>
                  {t('settingResetCollectionHint')}
                </Text>
              </Pressable>

              <Text style={styles.footerNote}>{t('settingsFooterNote')}</Text>
            </ScrollView>
          </View>

          <Pressable
            style={styles.backdrop}
            onPress={close}
            accessibilityLabel={t('menuClose')}
          />
        </View>
      </Modal>
    </>
  );
}
