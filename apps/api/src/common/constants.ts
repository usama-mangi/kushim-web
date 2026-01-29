/**
 * Application-wide constants and configuration
 * 
 * Values can be overridden via environment variables for flexibility
 */

// Pagination defaults
export const PAGINATION = {
  /**
   * Default page size for list endpoints
   * Can be overridden via PAGE_SIZE env var
   */
  DEFAULT_PAGE_SIZE: parseInt(process.env.PAGE_SIZE || '20', 10),

  /**
   * Maximum page size to prevent performance issues
   * Can be overridden via MAX_PAGE_SIZE env var
   */
  MAX_PAGE_SIZE: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),

  /**
   * Default offset for pagination
   */
  DEFAULT_OFFSET: 0,

  /**
   * Maximum number of linking candidates to consider during relationship discovery
   * Can be overridden via MAX_LINKING_CANDIDATES env var
   */
  MAX_LINKING_CANDIDATES: parseInt(process.env.MAX_LINKING_CANDIDATES || '100', 10),

  /**
   * Default page size for context group listings
   * Can be overridden via CONTEXT_GROUP_PAGE_SIZE env var
   */
  CONTEXT_GROUP_PAGE_SIZE: parseInt(process.env.CONTEXT_GROUP_PAGE_SIZE || '50', 10),

  /**
   * Maximum number of records to process in sync reconciliation
   * Can be overridden via SYNC_RECONCILIATION_LIMIT env var
   */
  SYNC_RECONCILIATION_LIMIT: parseInt(process.env.SYNC_RECONCILIATION_LIMIT || '100', 10),
};

// Rate limiting
export const RATE_LIMITS = {
  /**
   * OAuth endpoints rate limit (requests per minute)
   * Can be overridden via OAUTH_RATE_LIMIT env var
   */
  OAUTH_RPM: parseInt(process.env.OAUTH_RATE_LIMIT || '10', 10),

  /**
   * Standard API endpoints rate limit (requests per minute)
   * Can be overridden via API_RATE_LIMIT env var
   */
  API_RPM: parseInt(process.env.API_RATE_LIMIT || '100', 10),

  /**
   * Webhook endpoints rate limit (requests per minute)
   * Can be overridden via WEBHOOK_RATE_LIMIT env var
   */
  WEBHOOK_RPM: parseInt(process.env.WEBHOOK_RATE_LIMIT || '1000', 10),
};

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  /**
   * Context group cache duration
   * Can be overridden via CONTEXT_GROUP_CACHE_TTL env var
   */
  CONTEXT_GROUPS: parseInt(process.env.CONTEXT_GROUP_CACHE_TTL || '300', 10), // 5 minutes

  /**
   * User profile cache duration
   * Can be overridden via USER_PROFILE_CACHE_TTL env var
   */
  USER_PROFILES: parseInt(process.env.USER_PROFILE_CACHE_TTL || '600', 10), // 10 minutes

  /**
   * Platform data cache duration
   * Can be overridden via PLATFORM_DATA_CACHE_TTL env var
   */
  PLATFORM_DATA: parseInt(process.env.PLATFORM_DATA_CACHE_TTL || '180', 10), // 3 minutes
};

// ML Configuration
export const ML_CONFIG = {
  /**
   * Run ML in shadow mode (log predictions but don't create links)
   * Can be overridden via ML_SHADOW_MODE env var
   */
  SHADOW_MODE: process.env.ML_SHADOW_MODE !== 'false',

  /**
   * Enable ML-assisted linking
   * Can be overridden via ML_ENABLED env var
   */
  ENABLED: process.env.ML_ENABLED === 'true',

  /**
   * Threshold for ML-based link creation
   * Can be overridden via ML_THRESHOLD env var
   */
  THRESHOLD: parseFloat(process.env.ML_THRESHOLD || '0.85'),

  /**
   * Threshold for deterministic link creation
   * Can be overridden via DETERMINISTIC_THRESHOLD env var
   */
  DETERMINISTIC_THRESHOLD: parseFloat(process.env.DETERMINISTIC_THRESHOLD || '0.7'),
};

// Distributed Locking
export const LOCK_CONFIG = {
  /**
   * Default lock TTL in milliseconds
   * Can be overridden via LOCK_TTL_MS env var
   */
  DEFAULT_TTL_MS: parseInt(process.env.LOCK_TTL_MS || '10000', 10), // 10 seconds

  /**
   * Lock retry attempts
   * Can be overridden via LOCK_RETRY_COUNT env var
   */
  RETRY_COUNT: parseInt(process.env.LOCK_RETRY_COUNT || '3', 10),

  /**
   * Delay between retry attempts in milliseconds
   * Can be overridden via LOCK_RETRY_DELAY_MS env var
   */
  RETRY_DELAY_MS: parseInt(process.env.LOCK_RETRY_DELAY_MS || '200', 10),
};
