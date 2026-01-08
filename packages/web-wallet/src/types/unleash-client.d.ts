declare module '@hathor/unleash-client' {
  export enum FetchTogglesStatus {
    Updated = 'Updated',
    Unchanged = 'Unchanged',
  }

  export interface UnleashClientConfig {
    url: string | URL;
    clientKey: string;
    appName: string;
    refreshInterval?: number;
    disableRefresh?: boolean;
    context?: {
      userId?: string;
      properties?: Record<string, string>;
    };
  }

  export interface Toggle {
    name: string;
    enabled: boolean;
  }

  export default class UnleashClient {
    constructor(config: UnleashClientConfig);
    fetchToggles(): Promise<FetchTogglesStatus>;
    getToggles(): Toggle[];
    isEnabled(name: string): boolean;
  }
}
