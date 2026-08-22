import { authService } from '../authService';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';

jest.mock('../firebaseConfig', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  updateProfile: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('../firestoreService', () => ({
  firestoreService: {
    createUserProfile: jest.fn(),
  },
}));

describe('authService - input validations and error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should reject missing email or password', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow('Email and password are required.');
      await expect(authService.login('test@example.com', '')).rejects.toThrow('Email and password are required.');
    });

    it('should reject invalid email format', async () => {
      await expect(authService.login('invalid-email', 'password123')).rejects.toThrow('Invalid email address format.');
    });

    it('should call signInWithEmailAndPassword and succeed on valid input', async () => {
      const mockUser = { uid: 'user_123', email: 'test@example.com' };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      const user = await authService.login('test@example.com', 'password123');
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      expect(user).toEqual(mockUser);
    });
  });

  describe('register', () => {
    it('should reject missing name, email, or password', async () => {
      await expect(authService.register('', 'password123', 'John Doe')).rejects.toThrow('Email, password, and name are required.');
      await expect(authService.register('test@example.com', '', 'John Doe')).rejects.toThrow('Email, password, and name are required.');
      await expect(authService.register('test@example.com', 'password123', '')).rejects.toThrow('Email, password, and name are required.');
    });

    it('should reject empty name (spaces only)', async () => {
      await expect(authService.register('test@example.com', 'password123', '   ')).rejects.toThrow('Name cannot be empty.');
    });

    it('should reject invalid email format', async () => {
      await expect(authService.register('invalid-email', 'password123', 'John Doe')).rejects.toThrow('Invalid email address format.');
    });

    it('should reject weak password (< 6 chars)', async () => {
      await expect(authService.register('test@example.com', '12345', 'John Doe')).rejects.toThrow('Password must be at least 6 characters.');
    });

    it('should complete registration successfully with valid inputs', async () => {
      const mockUser = { uid: 'user_123', email: 'test@example.com' };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({ user: mockUser });

      const user = await authService.register('test@example.com', 'password123', 'John Doe');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'John Doe' });
      expect(user).toEqual(mockUser);
    });
  });

  describe('resetPassword', () => {
    it('should reject empty email', async () => {
      await expect(authService.resetPassword('')).rejects.toThrow('Email is required.');
    });

    it('should reject invalid email format', async () => {
      await expect(authService.resetPassword('invalid-email')).rejects.toThrow('Invalid email address format.');
    });

    it('should trigger password reset on valid email', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      await authService.resetPassword('test@example.com');
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.anything(), 'test@example.com');
    });
  });
});
