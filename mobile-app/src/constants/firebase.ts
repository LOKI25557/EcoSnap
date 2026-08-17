export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  WASTE_RECORDS: 'wasteRecords',
  PICKUP_REQUESTS: 'pickupRequests',
  COMMUNITY_REPORTS: 'communityReports',
} as const;

export const WASTE_QUERY_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const PICKUP_QUERY_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const REPORT_QUERY_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

// Validation limits
export const MAX_REPORT_DESCRIPTION_LENGTH = 1000;
export const MAX_REPORT_ADDRESS_LENGTH = 250;

// Centralized report types and statuses
export const REPORT_TYPES = [
  'illegal_dumping',
  'overflowing_bin',
  'damaged_bin',
  'recycling_facility_issue',
  'other'
] as const;

export const REPORT_STATUS_VALUES = [
  'pending',
  'under_review',
  'verified',
  'resolved',
  'rejected'
] as const;
