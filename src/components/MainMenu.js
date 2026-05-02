import React from 'react';
import {
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
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

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

export default function MainMenu() {
  const insets = useSafeAreaInsets();
  const { t, locale, setLocale } = useLanguage();
  const {
    soundsEnabled,
    notificationsEnabled,
    setSoundsEnabled,
    setNotificationsEnabled,
  } = useSettings();
  const { discoveryHistory } = useFigures();
  const [open, setOpen] = React.useState(false);

  const drawerWidth = Math.min(
    DRAWER_MAX,
    Dimensions.get('window').width * 0.88
  );

  const close = React.useCallback(() => setOpen(false), []);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.burger, pressed && styles.burgerPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('menuAccessibilityOpen')}
      >
        <Ionicons name="menu" size={26} color="#111827" />
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
                <Ionicons name="close" size={28} color="#374151" />
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
                      <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
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
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={soundsEnabled ? '#1D4ED8' : '#F3F4F6'}
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
                  trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                  thumbColor={notificationsEnabled ? '#1D4ED8' : '#F3F4F6'}
                />
              </View>

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

const styles = StyleSheet.create({
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
    backgroundColor: '#FFFFFF',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E5E7EB',
    flexDirection: 'column',
    shadowColor: '#000',
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
    borderBottomColor: '#E5E7EB',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
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
    color: '#6B7280',
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
    backgroundColor: '#F3F4F6',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  langRowActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
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
    color: '#374151',
  },
  langLabelActive: {
    color: '#1E1B4B',
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
    borderBottomColor: '#F3F4F6',
  },
  settingTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  settingHint: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  footerNote: {
    marginTop: 20,
    fontSize: 12,
    lineHeight: 17,
    color: '#9CA3AF',
  },
  historyEmpty: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  historyRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  historyMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
});
