import { getProfilePath, getWasteImagePath, getReportImagePath, sanitizeFileName } from './utils/storagePaths';
import { getMimeTypeFromUri, validateMedia } from './utils/storageValidation';
import { storageService } from './services/firebase/storageService';

// Test path helpers
console.log('--- Testing Storage Path Helpers ---');
const testUid = 'user123';
const testRecordId = 'wasteRec999';
const testReportId = 'report555';
const dirtyFilename = '../../../etc/passwd/some_file.jpg';

const cleanName = sanitizeFileName(dirtyFilename);
console.log(`Sanitized name: ${cleanName}`); // Should be 'some_file.jpg'

const profilePath = getProfilePath(testUid, dirtyFilename);
console.log(`Profile Path: ${profilePath}`); // Should be: users/user123/profile/some_file.jpg

const wastePath = getWasteImagePath(testUid, testRecordId, dirtyFilename);
console.log(`Waste Path: ${wastePath}`); // Should be: users/user123/waste/wasteRec999/some_file.jpg

const reportPath = getReportImagePath(testUid, testReportId, dirtyFilename);
console.log(`Report Path: ${reportPath}`); // Should be: users/user123/reports/report555/some_file.jpg

// Test MIME detection
console.log('\n--- Testing MIME detection ---');
console.log(`JPG mime: ${getMimeTypeFromUri('test.jpg')}`);
console.log(`JPEG mime: ${getMimeTypeFromUri('test.jpeg')}`);
console.log(`PNG mime: ${getMimeTypeFromUri('test.png')}`);
console.log(`WEBP mime: ${getMimeTypeFromUri('test.webp')}`);
console.log(`TXT mime: ${getMimeTypeFromUri('test.txt')}`);

// Test validation edge cases
console.log('\n--- Testing Validation Errors ---');
const testValidation = async () => {
  try {
    await validateMedia('');
  } catch (err: any) {
    console.log(`Caught empty URI error: ${err.message}`);
  }

  try {
    await validateMedia('file:///some/empty/');
  } catch (err: any) {
    console.log(`Caught invalid filename error: ${err.message}`);
  }

  try {
    await validateMedia('file:///some/file.gif');
  } catch (err: any) {
    // Note: this might throw file does not exist first, but we check if we check existence first.
    console.log(`Caught validation error: ${err.message}`);
  }
};

testValidation().then(() => {
  console.log('\nValidation tests execution completed.');
});
