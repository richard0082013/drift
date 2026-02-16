/**
 * Offline Check-in Queue
 *
 * Persists queued check-ins in AsyncStorage when offline.
 * State machine: ONLINE ↔ OFFLINE, with auto-flush on reconnect.
 *
 * Max retries: 3. 409 DUPLICATE_CHECKIN treated as success (remove from queue).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ApiClient, ApiResult } from "../api/client";
import type { ApiCheckInResponse } from "../../types/api";

export type QueuedCheckin = {
  id: string;
  date: string;
  energy: number;
  stress: number;
  social: number;
  keyContact?: string;
  queuedAt: string;
  retryCount: number;
};

const QUEUE_KEY = "drift:checkin_queue";
const MAX_RETRIES = 3;

// ── Queue CRUD ──

export async function getQueue(): Promise<QueuedCheckin[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as QueuedCheckin[];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedCheckin[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(
  checkin: Omit<QueuedCheckin, "id" | "queuedAt" | "retryCount">
): Promise<void> {
  const queue = await getQueue();
  const item: QueuedCheckin = {
    ...checkin,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    queuedAt: new Date().toISOString(),
    retryCount: 0,
  };
  queue.push(item);
  await saveQueue(queue);
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await saveQueue(queue.filter((item) => item.id !== id));
}

export async function incrementRetry(id: string): Promise<void> {
  const queue = await getQueue();
  const item = queue.find((i) => i.id === id);
  if (item) {
    item.retryCount += 1;
  }
  await saveQueue(queue);
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function getQueueSize(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

// ── Flush ──

export type FlushResult = {
  flushed: number;
  failed: number;
};

export async function flushCheckinQueue(apiClient: ApiClient): Promise<FlushResult> {
  const queue = await getQueue();
  let flushed = 0;
  let failed = 0;

  for (const item of queue) {
    if (item.retryCount >= MAX_RETRIES) {
      // Skip permanently failed items
      failed += 1;
      continue;
    }

    const result: ApiResult<ApiCheckInResponse> = await apiClient.post("/api/checkins", {
      date: item.date,
      energy: item.energy,
      stress: item.stress,
      social: item.social,
      key_contact: item.keyContact || undefined,
    });

    if (result.ok) {
      await removeFromQueue(item.id);
      flushed += 1;
    } else if (result.status === 409) {
      // Duplicate — already submitted, treat as success
      await removeFromQueue(item.id);
      flushed += 1;
    } else {
      await incrementRetry(item.id);
      failed += 1;
    }
  }

  return { flushed, failed };
}
