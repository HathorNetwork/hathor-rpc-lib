/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import UnleashClient, { FetchTogglesStatus } from '@hathor/unleash-client';
import {
  UNLEASH_URL,
  UNLEASH_CLIENT_KEY,
  UNLEASH_POLLING_INTERVAL,
  WEB_WALLET_MAINTENANCE_TOGGLE,
  FEATURE_TOGGLE_DEFAULTS,
  STAGE,
  SKIP_FEATURE_TOGGLE,
} from '../constants';

const MAX_RETRIES = 5;
const RETRY_DELAY = 500;
const BROWSER_ID_KEY = 'hathor:browserId';

/**
 * Gets or creates a unique browser identifier stored in localStorage.
 * This ID is used to identify the browser for feature toggle targeting in Unleash.
 */
function getBrowserId(): string {
  let browserId = localStorage.getItem(BROWSER_ID_KEY);

  if (!browserId) {
    browserId = crypto.randomUUID();
    localStorage.setItem(BROWSER_ID_KEY, browserId);
  }

  return browserId;
}

interface FeatureToggleContextType {
  isUnderMaintenance: boolean;
  isLoading: boolean;
  featureToggles: Record<string, boolean>;
  /** Unique browser identifier used for feature toggle targeting */
  browserId: string;
}

const FeatureToggleContext = createContext<FeatureToggleContextType | null>(null);

interface FeatureToggleProviderProps {
  children: ReactNode;
}

function mapFeatureToggles(toggles: Array<{ name: string; enabled: boolean }>): Record<string, boolean> {
  // Start with defaults, then override with values from the response
  const result = { ...FEATURE_TOGGLE_DEFAULTS };

  for (const toggle of toggles) {
    result[toggle.name] = toggle.enabled ?? false;
  }

  return result;
}

export function FeatureToggleProvider({ children }: FeatureToggleProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>(FEATURE_TOGGLE_DEFAULTS);
  const unleashClientRef = useRef<UnleashClient | null>(null);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef(0);

  // Get or create a unique browser ID for feature toggle targeting
  const browserId = getBrowserId();

  useEffect(() => {
    let mounted = true;

    // Skip feature toggle check if configured (e.g., for tests/CI)
    if (SKIP_FEATURE_TOGGLE) {
      setIsLoading(false);
      return;
    }

    async function initializeUnleash(retry = 0): Promise<void> {
      try {
        const unleashClient = new UnleashClient({
          url: UNLEASH_URL,
          clientKey: UNLEASH_CLIENT_KEY,
          refreshInterval: -1,
          disableRefresh: true, // We handle polling ourselves
          appName: 'web-wallet',
          context: {
            userId: browserId,
            properties: {
              platform: 'web',
              stage: STAGE,
            },
          },
        });

        unleashClientRef.current = unleashClient;

        await unleashClient.fetchToggles();

        if (!mounted) return;

        const toggles = unleashClient.getToggles();
        setFeatureToggles(mapFeatureToggles(toggles));
        setIsLoading(false);
        retryCountRef.current = 0;

        // Start polling for updates
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const status = await unleashClient.fetchToggles();
            if (status === FetchTogglesStatus.Updated && mounted) {
              const updatedToggles = unleashClient.getToggles();
              setFeatureToggles(mapFeatureToggles(updatedToggles));
            }
          } catch (error) {
            console.error('Error fetching feature toggles:', error);
          }
        }, UNLEASH_POLLING_INTERVAL);
      } catch (error) {
        console.error('Error initializing Unleash:', error);

        if (retry < MAX_RETRIES) {
          // Retry with exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, retry);
          setTimeout(() => {
            if (mounted) {
              initializeUnleash(retry + 1);
            }
          }, delay);
        } else {
          // Max retries reached, use defaults and allow app to continue
          console.error('Max retries reached for Unleash initialization. Using defaults.');
          if (mounted) {
            setIsLoading(false);
          }
        }
      }
    }

    initializeUnleash();

    return () => {
      mounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Clear the reference (unleash-client doesn't have a close method)
      unleashClientRef.current = null;
    };
  }, []);

  const isUnderMaintenance = featureToggles[WEB_WALLET_MAINTENANCE_TOGGLE] ?? FEATURE_TOGGLE_DEFAULTS[WEB_WALLET_MAINTENANCE_TOGGLE];

  return (
    <FeatureToggleContext.Provider value={{ isUnderMaintenance, isLoading, featureToggles, browserId }}>
      {children}
    </FeatureToggleContext.Provider>
  );
}

export function useFeatureToggle() {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggle must be used within a FeatureToggleProvider');
  }
  return context;
}
