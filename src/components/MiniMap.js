import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function Street({ style }) {
  return <View style={[styles.street, style]} />;
}

function Block({ style }) {
  return <View style={[styles.block, style]} />;
}

function Poi({ label, style, mission }) {
  return (
    <View style={[styles.poi, mission && styles.poiMission, style]}>
      <Text style={[styles.poiLabel, mission && styles.poiMissionLabel]}>{label}</Text>
    </View>
  );
}

export default function MiniMap({
  districtName = 'KENTRON',
  distanceMeters = 0,
  azimuthDeg = 0,
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.map}>
        <View style={styles.textureA} />
        <View style={styles.textureB} />
        <View style={styles.textureC} />

        <Block style={{ top: 18, left: 14, width: 84, height: 62 }} />
        <Block style={{ top: 20, right: 24, width: 108, height: 48 }} />
        <Block style={{ top: 88, left: 22, width: 102, height: 66 }} />
        <Block style={{ top: 96, right: 18, width: 126, height: 58 }} />
        <Block style={{ bottom: 18, left: 24, width: 118, height: 58 }} />
        <Block style={{ bottom: 22, right: 14, width: 96, height: 54 }} />

        <Street style={{ top: 48, left: 0, right: 0, height: 2 }} />
        <Street style={{ top: 124, left: 0, right: 0, height: 2 }} />
        <Street style={{ bottom: 58, left: 0, right: 0, height: 2 }} />
        <Street
          style={{ top: 0, bottom: 0, left: '34%', width: 2, transform: [{ skewY: '8deg' }] }}
        />
        <Street
          style={{ top: 0, bottom: 0, left: '62%', width: 2, transform: [{ skewY: '-6deg' }] }}
        />

        <Poi label="⛽" style={{ top: 58, left: 54 }} />
        <Poi label="⚑" style={{ top: 142, right: 64 }} />
        <Poi label="$" mission style={{ bottom: 44, right: 44 }} />

        <View
          style={[
            styles.playerWrap,
            {
              transform: [{ rotate: `${azimuthDeg}deg` }],
            },
          ]}
        >
          <View style={styles.playerTriangle} />
        </View>

        <View style={styles.bottomLeftHud}>
          <Text style={styles.district}>{districtName}</Text>
          <View style={styles.scaleWrap}>
            <View style={styles.scaleBar} />
            <Text style={styles.scaleText}>50m</Text>
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>LEGEND</Text>
        <Text style={styles.legendItem}>▲ You</Text>
        <Text style={styles.legendItem}>○ POI</Text>
        <Text style={styles.legendItem}>$ Mission</Text>
        <Text style={styles.legendItem}>Dist: {distanceMeters}m</Text>
        <Text style={styles.legendItem}>Azimuth: {azimuthDeg}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  map: {
    flex: 1,
    minHeight: 220,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f1f1f',
  },
  textureA: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -40,
    right: -30,
  },
  textureB: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.03)',
    bottom: -35,
    left: -20,
  },
  textureC: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.02)',
    top: 70,
    left: 120,
  },
  block: {
    position: 'absolute',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  street: {
    position: 'absolute',
    backgroundColor: '#c8c8c8',
    opacity: 0.6,
  },
  poi: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#101010',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiMission: {
    borderColor: '#22c55e',
  },
  poiLabel: {
    color: '#f5f5f5',
    fontSize: 10,
    fontWeight: '700',
  },
  poiMissionLabel: {
    color: '#22c55e',
    fontSize: 11,
  },
  playerWrap: {
    position: 'absolute',
    top: '49%',
    left: '49%',
    marginLeft: -10,
    marginTop: -10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2dd4bf',
  },
  bottomLeftHud: {
    position: 'absolute',
    left: 10,
    bottom: 10,
  },
  district: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scaleWrap: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scaleBar: {
    width: 52,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d4d4d4',
  },
  scaleText: {
    color: '#d4d4d4',
    fontSize: 11,
    fontWeight: '700',
  },
  legend: {
    width: 112,
    borderRadius: 12,
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderWidth: 1,
    borderColor: '#262626',
    padding: 10,
    justifyContent: 'flex-start',
  },
  legendTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  legendItem: {
    color: '#ffffff',
    fontSize: 10,
    marginBottom: 4,
    fontWeight: '600',
  },
});
