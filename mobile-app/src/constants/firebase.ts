export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  WASTE_RECORDS: 'wasteRecords',
} as const;

export const WASTE_QUERY_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;
