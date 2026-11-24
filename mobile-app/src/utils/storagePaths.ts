/**
 * Sanitizes a filename to prevent path traversal and remove characters
 * that are unsafe for URLs or Firebase Storage.
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  // Get only the last segment of the path to prevent directory traversal
  const parts = fileName.split('/');
  const baseName = parts[parts.length - 1];
  // Replace non-alphanumeric characters (except dots, hyphens, and underscores) with underscores
  return baseName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
};

/**
 * Builds the path for a user's profile image.
 * Expected: users/{uid}/profile/{filename}
 */
export const getProfilePath = (uid: string, fileName: string): string => {
  if (!uid || uid.trim() === '') {
    throw new Error('User ID is required for profile path');
  }
  if (!fileName || fileName.trim() === '') {
    throw new Error('Filename is required for profile path');
  }
  const cleanFileName = sanitizeFileName(fileName);
  return `users/${uid}/profile/${cleanFileName}`;
};

/**
 * Builds the path for a waste record image.
 * Expected: users/{uid}/waste/{recordId}/{filename}
 */
export const getWasteImagePath = (uid: string, recordId: string, fileName: string): string => {
  if (!uid || uid.trim() === '') {
    throw new Error('User ID is required for waste image path');
  }
  if (!recordId || recordId.trim() === '') {
    throw new Error('Record ID is required for waste image path');
  }
  if (!fileName || fileName.trim() === '') {
    throw new Error('Filename is required for waste image path');
  }
  const cleanFileName = sanitizeFileName(fileName);
  return `users/${uid}/waste/${recordId}/${cleanFileName}`;
};

/**
 * Builds the path for a community report image.
 * Expected: users/{uid}/reports/{reportId}/{filename}
 */
export const getReportImagePath = (uid: string, reportId: string, fileName: string): string => {
  if (!uid || uid.trim() === '') {
    throw new Error('User ID is required for report image path');
  }
  if (!reportId || reportId.trim() === '') {
    throw new Error('Report ID is required for report image path');
  }
  if (!fileName || fileName.trim() === '') {
    throw new Error('Filename is required for report image path');
  }
  const cleanFileName = sanitizeFileName(fileName);
  return `users/${uid}/reports/${reportId}/${cleanFileName}`;
};
