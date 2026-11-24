import { notificationRepository } from '../notificationRepository';
import { authService } from '../authService';
import { notificationEventService } from '../notificationEventService';
import { Notification } from '../../../types/Notification';

jest.mock('../authService', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('../firebaseConfig', () => ({
  db: 'mockDbInstance',
}));

let mockDb: {
  users: Record<string, {
    notifications: Record<string, any>;
    notificationPreferences: Record<string, any>;
    devices: Record<string, any>;
    profile: any;
  }>;
} = { users: {} };

beforeEach(() => {
  mockDb = { users: {} };
  jest.clearAllMocks();
  // Default to user_123 as authenticated user
  (authService.getCurrentUser as jest.Mock).mockReturnValue({ uid: 'user_123' });
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn(),
    collection: jest.fn((...args) => {
      const parts = args.filter(a => typeof a === 'string' && a !== 'mockDbInstance');
      return { path: parts.join('/') };
    }),
    doc: jest.fn((...args) => {
      const parts: string[] = [];
      args.forEach(a => {
        if (typeof a === 'string') {
          if (a !== 'mockDbInstance') {
            parts.push(a);
          }
        } else if (a && typeof a === 'object' && a.path) {
          parts.push(a.path);
        }
      });
      const fullPath = parts.join('/');
      const segments = fullPath.split('/');
      let id = '';
      if (segments.length % 2 === 1) {
        id = Math.random().toString(36).substring(2, 11);
        segments.push(id);
      } else {
        id = segments[segments.length - 1];
      }
      return { id, path: segments.join('/') };
    }),
    setDoc: jest.fn(async (docRef, data, options) => {
      const parts = docRef.path.split('/');
      const userId = parts[1];
      if (!mockDb.users[userId]) {
        mockDb.users[userId] = { notifications: {}, notificationPreferences: {}, devices: {}, profile: {} };
      }
      
      const cleanData = { ...data };
      if (cleanData.createdAt && typeof cleanData.createdAt === 'function') {
        cleanData.createdAt = new Date();
      }
      if (cleanData.updatedAt && typeof cleanData.updatedAt === 'function') {
        cleanData.updatedAt = new Date();
      }
      if (cleanData.lastSeenAt && typeof cleanData.lastSeenAt === 'function') {
        cleanData.lastSeenAt = new Date();
      }

      if (parts.length === 2) {
        if (options && options.merge) {
          mockDb.users[userId].profile = { ...mockDb.users[userId].profile, ...cleanData };
        } else {
          mockDb.users[userId].profile = cleanData;
        }
      } else if (parts[2] === 'notifications') {
        const id = parts[3];
        if (options && options.merge) {
          mockDb.users[userId].notifications[id] = { ...mockDb.users[userId].notifications[id], ...cleanData };
        } else {
          mockDb.users[userId].notifications[id] = cleanData;
        }
      } else if (parts[2] === 'notificationPreferences') {
        if (options && options.merge) {
          mockDb.users[userId].notificationPreferences.settings = {
            ...mockDb.users[userId].notificationPreferences.settings,
            ...cleanData
          };
        } else {
          mockDb.users[userId].notificationPreferences.settings = cleanData;
        }
      } else if (parts[2] === 'devices') {
        const id = parts[3];
        if (options && options.merge) {
          mockDb.users[userId].devices[id] = { ...mockDb.users[userId].devices[id], ...cleanData };
        } else {
          mockDb.users[userId].devices[id] = cleanData;
        }
      }
    }),
    getDoc: jest.fn(async (docRef) => {
      const parts = docRef.path.split('/');
      const userId = parts[1];
      const user = mockDb.users[userId];
      
      let exists = false;
      let data: any = null;
      let id = docRef.id;

      if (user) {
        if (parts.length === 2) {
          exists = !!user.profile && Object.keys(user.profile).length > 0;
          data = user.profile;
        } else if (parts[2] === 'notifications') {
          const notifId = parts[3];
          exists = !!user.notifications[notifId];
          data = user.notifications[notifId];
        } else if (parts[2] === 'notificationPreferences') {
          exists = !!user.notificationPreferences.settings;
          data = user.notificationPreferences.settings;
        } else if (parts[2] === 'devices') {
          const devId = parts[3];
          exists = !!user.devices[devId];
          data = user.devices[devId];
        }
      }

      return {
        exists: () => exists,
        id,
        data: () => data,
      };
    }),
    deleteDoc: jest.fn(async (docRef) => {
      const parts = docRef.path.split('/');
      const userId = parts[1];
      const user = mockDb.users[userId];
      if (user) {
        if (parts[2] === 'notifications') {
          delete user.notifications[docRef.id];
        } else if (parts[2] === 'devices') {
          delete user.devices[docRef.id];
        }
      }
    }),
    getDocs: jest.fn(async (queryRef) => {
      const parts = queryRef.path.split('/');
      const userId = parts[1];
      const user = mockDb.users[userId];
      
      const docs: any[] = [];
      if (user) {
        if (parts[2] === 'notifications') {
          let items = Object.values(user.notifications);
          if (queryRef.constraints) {
            queryRef.constraints.forEach((c: any) => {
              if (c.field === 'read' && c.op === '==') {
                items = items.filter(i => i.read === c.value);
              }
            });
          }
          items.forEach(i => {
            docs.push({
              id: i.id,
              ref: { id: i.id, path: 'users/' + userId + '/notifications/' + i.id },
              data: () => i,
            });
          });
        } else if (parts[2] === 'devices') {
          Object.values(user.devices).forEach(d => {
            docs.push({
              id: d.deviceId,
              ref: { id: d.deviceId, path: 'users/' + userId + '/devices/' + d.deviceId },
              data: () => d,
            });
          });
        }
      }
      return {
        docs,
        size: docs.length,
        empty: docs.length === 0,
        forEach: (callback: any) => docs.forEach(callback),
      };
    }),
    query: jest.fn((colRef, ...constraints) => {
      return {
        path: colRef.path,
        constraints: constraints.filter(c => c && typeof c === 'object')
      };
    }),
    where: jest.fn((field, op, value) => {
      return { type: 'where', field, op, value };
    }),
    orderBy: jest.fn((field, dir) => {
      return { type: 'orderBy', field, dir };
    }),
    limit: jest.fn((val) => {
      return { type: 'limit', value: val };
    }),
    startAfter: jest.fn((val) => {
      return { type: 'startAfter', value: val };
    }),
    serverTimestamp: jest.fn(() => () => new Date()),
    writeBatch: jest.fn(() => {
      const updates: any[] = [];
      return {
        update: jest.fn((docRef, data) => {
          updates.push({ docRef, data });
        }),
        commit: jest.fn(async () => {
          for (const u of updates) {
            const parts = u.docRef.path.split('/');
            const userId = parts[1];
            const notifId = parts[3];
            if (mockDb.users[userId]?.notifications[notifId]) {
              mockDb.users[userId].notifications[notifId] = {
                ...mockDb.users[userId].notifications[notifId],
                ...u.data,
                updatedAt: new Date()
              };
            }
          }
        })
      };
    })
  };
});

describe('Notification Infrastructure Tests (Milestone 14 QA Regression Verified)', () => {
  const userId = 'user_123';

  // 1. Notification Creation
  test('should create a notification successfully', async () => {
    const input = {
      userId,
      type: 'general' as const,
      title: 'Welcome',
      body: 'Welcome to EcoSnap!',
    };

    const notifId = await notificationRepository.create(input);
    expect(notifId).toBeDefined();

    const notif = await notificationRepository.get(userId, notifId);
    expect(notif).toBeDefined();
    expect(notif?.title).toBe(input.title);
    expect(notif?.body).toBe(input.body);
    expect(notif?.read).toBe(false);
  });

  // 2. Notification Type Validation
  test('should throw an error for invalid notification type', async () => {
    const input = {
      userId,
      type: 'invalid_type' as any,
      title: 'Welcome',
      body: 'Welcome to EcoSnap!',
    };

    await expect(notificationRepository.create(input)).rejects.toThrow('Invalid notification type');
  });

  // 3. Notification History & 4. Unread Filtering
  test('should list notification history with unread filtering', async () => {
    // Seed database
    await notificationRepository.create({ userId, type: 'general', title: 'N1', body: 'B1' });
    const id2 = await notificationRepository.create({ userId, type: 'pickup_completed', title: 'N2', body: 'B2' });
    await notificationRepository.create({ userId, type: 'report_resolved', title: 'N3', body: 'B3' });

    // Mark N2 as read
    await notificationRepository.markAsRead(userId, id2);

    // List all
    const all = await notificationRepository.list({ userId });
    expect(all.items.length).toBe(3);

    // List unread only
    const unread = await notificationRepository.list({ userId, unreadOnly: true });
    expect(unread.items.length).toBe(2);
    expect(unread.items.map(n => n.title)).not.toContain('N2');
  });

  // 5. Mark as Read & 6. Mark all as Read
  test('should mark notification as read and mark all as read', async () => {
    const id1 = await notificationRepository.create({ userId, type: 'general', title: 'N1', body: 'B1' });
    const id2 = await notificationRepository.create({ userId, type: 'general', title: 'N2', body: 'B2' });

    await notificationRepository.markNotificationAsRead(userId, id1);
    let notif1 = await notificationRepository.get(userId, id1);
    expect(notif1?.read).toBe(true);

    let notif2 = await notificationRepository.get(userId, id2);
    expect(notif2?.read).toBe(false);

    await notificationRepository.markAllNotificationsAsRead(userId);
    notif2 = await notificationRepository.get(userId, id2);
    expect(notif2?.read).toBe(true);
  });

  // 7. Unread Count
  test('should get accurate unread notification count', async () => {
    await notificationRepository.create({ userId, type: 'general', title: 'N1', body: 'B1' });
    const id2 = await notificationRepository.create({ userId, type: 'general', title: 'N2', body: 'B2' });

    let count = await notificationRepository.getUnreadNotificationCount(userId);
    expect(count).toBe(2);

    await notificationRepository.markAsRead(userId, id2);
    count = await notificationRepository.getUnreadNotificationCount(userId);
    expect(count).toBe(1);
  });

  // 8. Notification Preferences
  test('should retrieve defaults and update preferences successfully', async () => {
    // Retrieves default preferences when document doesn't exist
    const prefs = await notificationRepository.getNotificationPreferences(userId);
    expect(prefs.pickupUpdates).toBe(true);
    expect(prefs.reviews).toBe(false);

    // Update preferences
    await notificationRepository.updateNotificationPreferences(userId, { reviews: true, general: false });
    const updatedPrefs = await notificationRepository.getNotificationPreferences(userId);
    expect(updatedPrefs.reviews).toBe(true);
    expect(updatedPrefs.general).toBe(false);
    expect(updatedPrefs.pickupUpdates).toBe(true); // preserved default
  });

  // 9. Device Token Registration, 10. Update & 11. Removal
  test('should manage device push tokens correctly', async () => {
    const deviceId = 'dev_abc';
    const deviceData = { deviceId, pushToken: 'token_123', platform: 'ios' as const };

    // Register
    await notificationRepository.registerDeviceToken(userId, deviceData);
    let devices = await notificationRepository.getDeviceTokens(userId);
    expect(devices.length).toBe(1);
    expect(devices[0].pushToken).toBe('token_123');

    // Update token
    await notificationRepository.registerDeviceToken(userId, { ...deviceData, pushToken: 'token_456' });
    devices = await notificationRepository.getDeviceTokens(userId);
    expect(devices.length).toBe(1);
    expect(devices[0].pushToken).toBe('token_456');

    // Remove
    await notificationRepository.removeDeviceToken(userId, deviceId);
    devices = await notificationRepository.getDeviceTokens(userId);
    expect(devices.length).toBe(0);
  });

  // 12. Pickup Notification Event
  test('should trigger pickup notification events based on user preferences', async () => {
    // 12.1 Enabled preferences
    const notifId = await notificationEventService.triggerPickupEvent(userId, 'pickup_scheduled', 'pickup_999');
    expect(notifId).toBeDefined();
    const notif = await notificationRepository.get(userId, notifId!);
    expect(notif?.title).toBe('Pickup Scheduled');
    expect(notif?.data?.pickupId).toBe('pickup_999');

    // 12.2 Disabled preferences
    await notificationRepository.updateNotificationPreferences(userId, { pickupUpdates: false });
    const skippedId = await notificationEventService.triggerPickupEvent(userId, 'pickup_scheduled', 'pickup_999');
    expect(skippedId).toBeNull();
  });

  // 13. Community Report Notification Event
  test('should trigger community report notification events based on user preferences', async () => {
    // 13.1 Enabled preferences
    const notifId = await notificationEventService.triggerReportEvent(userId, 'report_verified', 'report_999');
    expect(notifId).toBeDefined();
    const notif = await notificationRepository.get(userId, notifId!);
    expect(notif?.title).toBe('Report Verified');
    expect(notif?.data?.reportId).toBe('report_999');

    // 13.2 Disabled preferences
    await notificationRepository.updateNotificationPreferences(userId, { communityReports: false });
    const skippedId = await notificationEventService.triggerReportEvent(userId, 'report_verified', 'report_999');
    expect(skippedId).toBeNull();
  });

  // 14. Ownership Behavior
  test('should prevent users from accessing or modifying another users data', async () => {
    const foreignUserId = 'user_456';

    // Try creating notification for another user
    await expect(notificationRepository.create({
      userId: foreignUserId,
      type: 'general',
      title: 'T',
      body: 'B'
    })).rejects.toThrow('Permission denied');

    // Try listing notification for another user
    await expect(notificationRepository.list({ userId: foreignUserId })).rejects.toThrow('Permission denied');

    // Try registering device token for another user
    await expect(notificationRepository.registerDeviceToken(foreignUserId, {
      deviceId: 'd1',
      pushToken: 't1',
      platform: 'android'
    })).rejects.toThrow('Permission denied');
  });

  // 15. Invalid Notification Payloads
  test('should throw errors when invalid notification details are supplied', async () => {
    // Missing title
    await expect(notificationRepository.create({
      userId,
      type: 'general',
      title: '',
      body: 'Body'
    })).rejects.toThrow('Notification title is required');

    // Missing body
    await expect(notificationRepository.create({
      userId,
      type: 'general',
      title: 'Title',
      body: '  '
    })).rejects.toThrow('Notification body is required');
  });
});
