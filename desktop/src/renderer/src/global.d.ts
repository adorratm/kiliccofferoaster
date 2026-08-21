/// <reference types="vite/client" />

export type OutboxRow = {
  id: string;
  collection: string;
  action: string;
  payload: string;
  updated_at: string;
};

export type OpsUser = {
  id: string;
  email: string;
  role: string;
  firstName?: string | null;
  lastName?: string | null;
  hasPassword?: boolean;
};

declare global {
  interface Window {
    ops: {
      getApiUrl: () => Promise<string>;
      outboxList: () => Promise<OutboxRow[]>;
      outboxAdd: (row: OutboxRow) => Promise<void>;
      outboxClear: (ids: string[]) => Promise<void>;
      cacheGet: (collection: string) => Promise<unknown[]>;
      cacheSet: (collection: string, rows: unknown[]) => Promise<void>;
      metaGet: (key: string) => Promise<string | null>;
      metaSet: (key: string, value: string) => Promise<void>;
      googleLogin: () => Promise<{ token: string }>;
      saveOfflineSession: (input: {
        email: string;
        token: string;
        user: OpsUser;
        password?: string;
      }) => Promise<void>;
      verifyOfflinePassword: (
        email: string,
        password: string,
      ) => Promise<{ token: string; user: OpsUser } | null>;
      offlineEmail: () => Promise<string | null>;
      hasOfflinePassword: () => Promise<boolean>;
      showNotification: (payload: {
        title: string;
        body: string;
        href?: string | null;
      }) => Promise<void>;
      onNotificationClick: (fn: (href: string) => void) => () => void;
      getAppVersion: () => Promise<string>;
      checkForUpdate: () => Promise<
        'disabled' | 'up-to-date' | 'downloading' | 'error'
      >;
      onUpdateEvent: (
        fn: (event: {
          type:
            | 'checking'
            | 'available'
            | 'not-available'
            | 'progress'
            | 'downloaded'
            | 'error'
            | 'disabled';
          version?: string;
          percent?: number;
          message?: string;
        }) => void,
      ) => () => void;
    };
  }
}

export {};
