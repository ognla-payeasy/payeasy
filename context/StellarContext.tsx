"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  isFreighterInstalled as checkFreighter,
  connectFreighter,
  getPublicKey as fetchPublicKey,
  checkConnection
} from "@/lib/stellar/wallet";
import { getWalletError, type WalletError } from "@/lib/stellar/errors";
import { useToast } from "@/hooks/useToast";

interface StellarContextType {
  publicKey: string | null;
  isConnected: boolean;
  isFreighterInstalled: boolean;
  isConnecting: boolean;
  isRestoring: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: WalletError | null;
  hasAccountChanged: boolean;
  setHasAccountChanged: (val: boolean) => void;
  announcement: string | null;
  announce: (message: string) => void;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function StellarProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFreighterInstalled, setIsFreighterInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [error, setError] = useState<WalletError | null>(null);
  const [hasAccountChanged, setHasAccountChanged] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const toast = useToast();

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(null), 2000);
  }, []);

  // Initialize connection state
  useEffect(() => {
    async function init() {
      setIsRestoring(true);
      try {
        const installed = await checkFreighter();
        setIsFreighterInstalled(installed);

        if (installed) {
          const connected = await checkConnection();
          if (connected) {
            const key = await fetchPublicKey();
            if (key) {
              setPublicKey(key);
              setIsConnected(true);
            }
          }
        }
      } catch (err) {
        console.error("Error restoring session:", err);
      } finally {
        setIsRestoring(false);
      }
    }
    init();
  }, []);

  // Multi-account change detection polling
  useEffect(() => {
    if (!isConnected || !publicKey) {
      setHasAccountChanged(false);
      return;
    }

    const interval = setInterval(async () => {
      try {
        const currentKey = await fetchPublicKey();
        if (currentKey && currentKey !== publicKey) {
          setHasAccountChanged(true);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, publicKey]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    setHasAccountChanged(false);
    try {
      const installed = await checkFreighter();
      if (!installed) {
        throw new Error("Freighter extension not found. Please install it to continue.");
      }

      const key = await Promise.race([
        connectFreighter(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timed out")), 30000)
        ),
      ]);

      if (key) {
        setPublicKey(key);
        setIsConnected(true);
        const truncatedKey = `${key.slice(0, 4)}...${key.slice(-4)}`;
        toast.success("Wallet connected — " + truncatedKey);
        announce("Wallet connected successfully.");
      } else {
        throw new Error("User rejected connection or failed to retrieve public key.");
      }
    } catch (err) {
      const walletErr = getWalletError(err);
      setError(walletErr);
      setIsConnected(false);
      setPublicKey(null);
      announce(`Error: ${walletErr.message}`);
    } finally {
      setIsConnecting(false);
    }
  }, [announce]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setIsConnected(false);
    setHasAccountChanged(false);
    announce("Wallet disconnected.");
  }, [announce]);

  return (
    <StellarContext.Provider
      value={{
        publicKey,
        isConnected,
        isFreighterInstalled,
        isConnecting,
        isRestoring,
        connect,
        disconnect,
        error,
        hasAccountChanged,
        setHasAccountChanged,
        announcement,
        announce,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar() {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error("useStellar must be used within a StellarProvider");
  }
  return context;
}

export const useStellarAuth = useStellar;
