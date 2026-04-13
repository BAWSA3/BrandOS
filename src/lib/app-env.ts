export type AppEnv = 'development' | 'preview' | 'staging' | 'production';

const VALID_ENVS: readonly AppEnv[] = ['development', 'preview', 'staging', 'production'];

export function getAppEnv(): AppEnv {
  const raw = process.env.NEXT_PUBLIC_APP_ENV;
  if (raw && (VALID_ENVS as readonly string[]).includes(raw)) {
    return raw as AppEnv;
  }
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
}

export function isProductionEnv(): boolean {
  return getAppEnv() === 'production';
}

export function isStagingEnv(): boolean {
  return getAppEnv() === 'staging';
}
