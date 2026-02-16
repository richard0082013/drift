/**
 * CSV Export Helper
 *
 * Downloads CSV from /api/export, saves to temp file, and presents Share Sheet.
 * Reads authoritative metadata from response headers (x-export-*),
 * falls back to client-side inference when headers are absent.
 * Uses Expo SDK 54 File/Paths API.
 */

import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { api } from "../api";
import type { ApiExportMetadata } from "../../types/api";

export type ExportResult =
  | { ok: true; metadata: ApiExportMetadata }
  | { ok: false; error: string };

/**
 * Fetches CSV export from backend and opens the Share Sheet.
 * Returns metadata (record count, generated-at, version) on success.
 */
export async function exportAndShare(): Promise<ExportResult> {
  // Fetch CSV via the API client (returns text due to content-type awareness)
  const result = await api.get<string>("/api/export");

  if (!result.ok) {
    return { ok: false, error: result.error.message };
  }

  const csvText = result.data;
  if (!csvText || typeof csvText !== "string") {
    return { ok: false, error: "Export returned empty data" };
  }

  // Build metadata: prefer backend headers, fall back to client-side inference
  const h = result.headers;
  const csvLines = csvText.split("\n").filter((l) => l.trim().length > 0);
  const fallbackCount = Math.max(0, csvLines.length - 1); // minus header row

  const metadata: ApiExportMetadata = {
    generatedAt: h?.["x-export-generated-at"] || new Date().toISOString(),
    recordCount: parseRecordCount(h?.["x-export-record-count"], fallbackCount),
    version: h?.["x-export-version"] || "1",
  };

  // Write to temp file using Expo SDK 54 File API
  const fileName = `drift-export-${new Date().toISOString().slice(0, 10)}.csv`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(csvText);

  // Check sharing availability and present Share Sheet
  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    return { ok: false, error: "Sharing is not available on this device" };
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: "Export Drift Data",
    UTI: "public.comma-separated-values-text",
  });

  return { ok: true, metadata };
}

/** Safely parse record count header, returning fallback on invalid/missing values */
function parseRecordCount(headerValue: string | undefined, fallback: number): number {
  if (!headerValue) return fallback;
  const parsed = parseInt(headerValue, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
