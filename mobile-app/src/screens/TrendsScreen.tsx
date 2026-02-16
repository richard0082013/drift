import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from "react-native";
import Svg, { Polyline, Circle, Line, Text as SvgText } from "react-native-svg";

import { api } from "../lib/api";
import { Card, CardBody, Button, Badge } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { ProGate } from "../components/ProGate";
import { colors } from "../config/theme";
import type { ApiTrendsResponse, ApiTrendPoint } from "../types/api";

type Period = 7 | 30;

export function TrendsScreen() {
  const [period, setPeriod] = useState<Period>(7);
  const [status, setStatus] = useState<"loading" | "error" | "empty" | "loaded">("loading");
  const [data, setData] = useState<ApiTrendPoint[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrends = useCallback(async (p: Period) => {
    setStatus("loading");
    const result = await api.get<ApiTrendsResponse>("/api/trends", { days: String(p) });
    if (result.ok) {
      if (result.data.data.length === 0) {
        setStatus("empty");
      } else {
        setData(result.data.data);
        setStatus("loaded");
      }
    } else {
      setError(result.error.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchTrends(period);
  }, [period, fetchTrends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrends(period);
    setRefreshing(false);
  }, [period, fetchTrends]);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral[500]} />
      }
    >
      {/* Period Switch */}
      <View style={styles.periodRow}>
        <Button
          title="7 Days"
          variant={period === 7 ? "primary" : "secondary"}
          size="sm"
          onPress={() => handlePeriodChange(7)}
        />
        <ProGate feature="trends_30d" fallback={
          <Button title="30 Days 🔒" variant="secondary" size="sm" onPress={() => {}} />
        }>
          <Button
            title="30 Days"
            variant={period === 30 ? "primary" : "secondary"}
            size="sm"
            onPress={() => handlePeriodChange(30)}
          />
        </ProGate>
      </View>

      {/* Content */}
      {status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error} onRetry={() => fetchTrends(period)} />
      ) : status === "empty" ? (
        <EmptyState message="No trend data yet. Check in for a few days to see your trends here." icon="📈" />
      ) : (
        <>
          {/* Chart */}
          <Card>
            <CardBody>
              <TrendChart data={data} />
            </CardBody>
          </Card>

          {/* Legend */}
          <View style={styles.legend}>
            <LegendItem color={colors.coral[500]} label="Energy" />
            <LegendItem color={colors.rose[500]} label="Stress" />
            <LegendItem color={colors.sage[500]} label="Social" />
          </View>

          {/* Data Table (accessible alternative) */}
          <Card>
            <CardBody>
              <Text style={styles.tableTitle}>Data Table</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.tableDateCell]}>Date</Text>
                <Text style={styles.tableCell}>E</Text>
                <Text style={styles.tableCell}>S</Text>
                <Text style={styles.tableCell}>So</Text>
              </View>
              {data.slice(-7).map((point) => (
                <View key={point.date} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableDateCell]}>
                    {point.date.slice(5)}
                  </Text>
                  <Text style={styles.tableCell}>{point.energy}</Text>
                  <Text style={styles.tableCell}>{point.stress}</Text>
                  <Text style={styles.tableCell}>{point.social}</Text>
                </View>
              ))}
            </CardBody>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

// ── SVG Line Chart ──

function TrendChart({ data }: { data: ApiTrendPoint[] }) {
  const screenWidth = Dimensions.get("window").width - 72; // padding
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 30 };
  const plotWidth = screenWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * plotWidth;
  const yScale = (v: number) => padding.top + plotHeight - ((v - 1) / 4) * plotHeight;

  const makeLine = (key: keyof Pick<ApiTrendPoint, "energy" | "stress" | "social">) =>
    data.map((p, i) => `${xScale(i)},${yScale(p[key])}`).join(" ");

  return (
    <Svg width={screenWidth} height={chartHeight}>
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map((v) => (
        <React.Fragment key={v}>
          <Line
            x1={padding.left} y1={yScale(v)}
            x2={screenWidth - padding.right} y2={yScale(v)}
            stroke={colors.cream[200]} strokeWidth={1}
          />
          <SvgText
            x={padding.left - 8} y={yScale(v) + 4}
            fontSize={10} fill={colors.slate[400]}
            textAnchor="end"
          >
            {v}
          </SvgText>
        </React.Fragment>
      ))}

      {/* Lines */}
      <Polyline points={makeLine("energy")} fill="none" stroke={colors.coral[500]} strokeWidth={2.5} />
      <Polyline points={makeLine("stress")} fill="none" stroke={colors.rose[500]} strokeWidth={2.5} />
      <Polyline points={makeLine("social")} fill="none" stroke={colors.sage[500]} strokeWidth={2.5} />

      {/* Dots */}
      {data.map((p, i) => (
        <React.Fragment key={i}>
          <Circle cx={xScale(i)} cy={yScale(p.energy)} r={3} fill={colors.coral[500]} />
          <Circle cx={xScale(i)} cy={yScale(p.stress)} r={3} fill={colors.rose[500]} />
          <Circle cx={xScale(i)} cy={yScale(p.social)} r={3} fill={colors.sage[500]} />
        </React.Fragment>
      ))}

      {/* X-axis labels */}
      {data.map((p, i) => {
        if (data.length <= 7 || i % Math.ceil(data.length / 7) === 0) {
          return (
            <SvgText
              key={`label-${i}`}
              x={xScale(i)} y={chartHeight - 5}
              fontSize={9} fill={colors.slate[400]}
              textAnchor="middle"
            >
              {p.date.slice(5)}
            </SvgText>
          );
        }
        return null;
      })}
    </Svg>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  content: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },
  legend: { flexDirection: "row", justifyContent: "center", gap: 24 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, color: colors.slate[600], fontFamily: "Raleway_500Medium" },
  tableTitle: { fontSize: 14, fontWeight: "600", color: colors.slate[600], fontFamily: "Raleway_600SemiBold", marginBottom: 8 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.cream[200], paddingBottom: 6 },
  tableRow: { flexDirection: "row", paddingVertical: 4 },
  tableCell: { flex: 1, fontSize: 13, color: colors.slate[600], fontFamily: "Raleway_400Regular", textAlign: "center" },
  tableDateCell: { flex: 2, textAlign: "left" },
});
