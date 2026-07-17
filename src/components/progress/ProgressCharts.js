import React, {useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, G, Line, Path} from 'react-native-svg';
import {ThemedText} from '../ThemedText';

// boostifywrite/src/components/AnalyticsCharts.tsx'teki grafik primitive'lerinin
// (3rd-party kütüphane kullanmadan, react-native-svg ile) bu projenin tema diline uyarlanmış hali

export function StatTile({ label, value, unit, caption, valueColor, style }) {
  return (
    <View style={[styles.tile, style]}>
      <ThemedText weight="bold" style={styles.tileLabel}>{label}</ThemedText>
      <View style={styles.tileValueRow}>
        <ThemedText weight="extraBold" style={[styles.tileValue, valueColor && { color: valueColor }]}>
          {value}
        </ThemedText>
        {!!unit && <ThemedText style={styles.tileUnit}>{unit}</ThemedText>}
      </View>
      {!!caption && <ThemedText style={styles.tileCaption}>{caption}</ThemedText>}
    </View>
  );
}

const LINE_HEIGHT = 160;
const LINE_PAD = { l: 28, r: 10, t: 22, b: 28 };

// width verilmezse container genişliğini ölçüp kullanır; çok noktalı serilerde
// (ör. 50 görev) çağıran taraf sabit bir genişlik verip yatay ScrollView içine alabilir.
// xLabels verilirse (data ile aynı uzunlukta, boş string'ler atlanır) noktaların altına yazılır.
export function LineTrend({ data, color = '#3E4EF0', width: fixedWidth, xLabels }) {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const width = fixedWidth ?? measuredWidth;

  if (!data || data.length === 0) return null;

  const innerW = Math.max(0, width - LINE_PAD.l - LINE_PAD.r);
  const innerH = LINE_HEIGHT - LINE_PAD.t - LINE_PAD.b;
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0;

  const points = data.map((d, i) => {
    const clamped = Math.min(100, Math.max(0, d.value));
    const x = LINE_PAD.l + stepX * i;
    const y = LINE_PAD.t + innerH * (1 - clamped / 100);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${LINE_PAD.t + innerH} L${points[0].x},${LINE_PAD.t + innerH} Z`;
  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <View
      onLayout={fixedWidth ? undefined : (e) => setMeasuredWidth(e.nativeEvent.layout.width)}
      style={{ height: LINE_HEIGHT, width: fixedWidth }}
    >
      {width > 0 && (
        <Svg width={width} height={LINE_HEIGHT}>
          {gridTicks.map((t) => {
            const y = LINE_PAD.t + innerH * (1 - t / 100);
            return (
              <Line key={t} x1={LINE_PAD.l} y1={y} x2={width - LINE_PAD.r} y2={y} stroke="#F3F4FF" strokeWidth={1} />
            );
          })}
          <Path d={areaPath} fill={color} fillOpacity={0.1} stroke="none" />
          <Path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={5} fill={color} stroke="#fff" strokeWidth={2} />
          ))}
        </Svg>
      )}
      {points.length > 0 && (
        <>
          <View style={[styles.lineBadge, { left: points[0].x - 14, top: points[0].y - 26, backgroundColor: color }]}>
            <ThemedText weight="extraBold" style={styles.lineBadgeText}>{Math.round(data[0].value)}</ThemedText>
          </View>
          {points.length > 1 && (
            <View style={[styles.lineBadge, { left: points[points.length - 1].x - 14, top: points[points.length - 1].y - 26, backgroundColor: color }]}>
              <ThemedText weight="extraBold" style={styles.lineBadgeText}>{Math.round(data[data.length - 1].value)}</ThemedText>
            </View>
          )}
        </>
      )}
      {xLabels && points.map((p, i) => (
        !!xLabels[i] && (
          <ThemedText key={i} style={[styles.lineXLabel, { left: p.x - 14, top: LINE_HEIGHT - LINE_PAD.b + 6 }]}>
            {xLabels[i]}
          </ThemedText>
        )
      ))}
      {gridTicks.map((t) => {
        const y = LINE_PAD.t + innerH * (1 - t / 100);
        return (
          <ThemedText key={`y-${t}`} style={[styles.lineYLabel, { top: y - 6 }]}>
            {t}
          </ThemedText>
        );
      })}
    </View>
  );
}

export function DonutChart({ segments, centerValue, centerLabel, size = 120, thickness = 16 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const GAP = 3;
  let offsetAcc = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={[size / 2, size / 2]}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#F3F4FF" strokeWidth={thickness} fill="none" />
          {total > 0 && segments.map((s, i) => {
            if (s.value <= 0) return null;
            const segLength = Math.max(0, (s.value / total) * circumference - GAP);
            const dashoffset = -offsetAcc;
            offsetAcc += (s.value / total) * circumference;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={s.color}
                strokeWidth={thickness}
                fill="none"
                strokeDasharray={`${segLength} ${circumference - segLength}`}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
              />
            );
          })}
        </G>
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={styles.donutCenter}>
          <ThemedText weight="extraBold" style={styles.donutCenterValue}>{centerValue}</ThemedText>
          <ThemedText weight="bold" style={styles.donutCenterLabel}>{centerLabel}</ThemedText>
        </View>
      </View>
    </View>
  );
}

export function ColumnBarChart({ items, max = 100 }) {
  return (
    <View style={styles.columnRow}>
      {items.map((item, i) => {
        const height = Math.max(6, (Math.min(max, Math.max(0, item.value)) / max) * 90);
        return (
          <View key={i} style={styles.column}>
            <ThemedText weight="bold" style={styles.columnValue}>{Math.round(item.value)}</ThemedText>
            <View style={styles.columnTrack}>
              <View style={[styles.columnBar, { height, backgroundColor: item.color }]} />
            </View>
            <ThemedText style={styles.columnLabel} numberOfLines={2}>{item.label}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

export function BarRow({ label, value, max = 100, color = '#3E4EF0' }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={styles.barRow}>
      <View style={styles.barRowHeader}>
        <ThemedText style={styles.barRowLabel} numberOfLines={1}>{label}</ThemedText>
        <ThemedText weight="bold" style={styles.barRowValue}>{value}</ThemedText>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${width}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4FF',
    padding: 12,
  },
  tileLabel: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: '#969696',
    marginBottom: 6,
  },
  tileValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  tileValue: {
    fontSize: 22,
    color: '#3A3A3A',
  },
  tileUnit: {
    fontSize: 12,
    color: '#969696',
    marginBottom: 2,
  },
  tileCaption: {
    fontSize: 11,
    color: '#969696',
    marginTop: 4,
  },
  lineBadge: {
    position: 'absolute',
    minWidth: 28,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignItems: 'center',
  },
  lineBadgeText: {
    fontSize: 11,
    color: '#fff',
  },
  lineXLabel: {
    position: 'absolute',
    width: 28,
    fontSize: 10,
    color: '#969696',
    textAlign: 'center',
  },
  lineYLabel: {
    position: 'absolute',
    left: 0,
    width: LINE_PAD.l - 6,
    fontSize: 9,
    color: '#969696',
    textAlign: 'right',
  },
  donutCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutCenterValue: {
    fontSize: 22,
    color: '#3A3A3A',
  },
  donutCenterLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#969696',
    marginTop: 2,
  },
  columnRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  column: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  columnValue: {
    fontSize: 13,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  columnTrack: {
    height: 90,
    width: '55%',
    maxWidth: 40,
    minWidth: 8,
    justifyContent: 'flex-end',
  },
  columnBar: {
    width: '100%',
    borderRadius: 6,
  },
  columnLabel: {
    fontSize: 10,
    color: '#969696',
    textAlign: 'center',
    marginTop: 6,
  },
  barRow: {
    marginBottom: 12,
  },
  barRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barRowLabel: {
    fontSize: 13,
    color: '#3A3A3A',
    flex: 1,
    marginRight: 8,
  },
  barRowValue: {
    fontSize: 13,
    color: '#3A3A3A',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F3F4FF',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});
