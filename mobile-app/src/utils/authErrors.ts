import { AuthError } from '../types/Auth';

/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * Prevents internal system details from being exposed to end-users.
 */
export const mapAuthError = (error: any): AuthError => {
  const code = error?.code || 'auth/unknown';
  let message = 'An unexpected error occurred. Please try again.';

  switch (code) {
    case 'auth/invalid-email':
      message = 'The email address provided is invalid.';
      break;
    case 'auth/user-disabled':
      message = 'This user account has been disabled.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again.';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid email or password.';
      break;
    case 'auth/email-already-in-use':
      message = 'This email address is already in use by another account.';
      break;
    case 'auth/weak-password':
      message = 'The password is too weak. Please use at least 6 characters.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many requests. Please try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'A network error occurred. Please check your internet connection.';
      break;
    default:
      break;
  }

  return { code, message };
};
