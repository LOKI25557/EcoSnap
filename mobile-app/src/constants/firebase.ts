export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  WASTE_RECORDS: 'wasteRecords',
  PICKUP_REQUESTS: 'pickupRequests',
  COMMUNITY_REPORTS: 'communityReports',
  FACILITIES: 'facilities',
  REVIEWS: 'reviews',
} as const;

export const NOTIFICATIONS_COLLECTION = 'notifications';
export const NOTIFICATION_PREFERENCES_COLLECTION = 'notificationPreferences';
export const NOTIFICATION_PREFERENCES_DOC = 'settings';
export const DEVICES_COLLECTION = 'devices';

export const NOTIFICATION_QUERY_DEFAULTS = {
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const NOTIFICATION_EXPIRATION_DAYS = 30;

export const REVIEW_COLLECTION = 'reviews';
export const FACILITY_COLLECTION = 'facilities';

export const MIN_RATING = 1;
export const MAX_RATING = 5;
export const MAX_REVIEW_LENGTH = 500;
export const DEFAULT_REVIEW_PAGE_SIZE = 10;
export const MAX_REVIEW_PAGE_SIZE = 50;

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
