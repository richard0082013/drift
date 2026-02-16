/**
 * Network Status Context
 *
 * Monitors connectivity via NetInfo and triggers offline queue flush on reconnect.
 * Provides `isOnline` flag to all screens for OfflineBanner display.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { flushCheckinQueue, type FlushResult } from "./checkin-queue";
import { api } from "../api";

type NetworkState = {
  isOnline: boolean;
  /** Last flush result, if any */
  lastFlush: FlushResult | null;
};

const NetworkContext = createContext<NetworkState>({
  isOnline: true,
  lastFlush: null,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastFlush, setLastFlush] = useState<FlushResult | null>(null);
  const wasOffline = useRef(false);

  const handleConnectivityChange = useCallback(async (state: NetInfoState) => {
    const online = state.isConnected === true && state.isInternetReachable !== false;
    setIsOnline(online);

    // Flush queue on reconnect (was offline → now online)
    if (online && wasOffline.current) {
      try {
        const result = await flushCheckinQueue(api);
        if (result.flushed > 0 || result.failed > 0) {
          setLastFlush(result);
        }
      } catch {
        // Silently fail — will retry next reconnect
      }
    }

    wasOffline.current = !online;
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);
    return () => unsubscribe();
  }, [handleConnectivityChange]);

  return (
    <NetworkContext.Provider value={{ isOnline, lastFlush }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkState {
  return useContext(NetworkContext);
}
