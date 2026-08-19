import { notificationRepository } from './notificationRepository';
import { NotificationType, NotificationData } from '../../types/Notification';

export type PickupEventType =
  | 'pickup_created'
  | 'pickup_scheduled'
  | 'pickup_assigned'
  | 'pickup_completed'
  | 'pickup_cancelled';

export type ReportEventType =
  | 'report_under_review'
  | 'report_verified'
  | 'report_rejected'
  | 'report_resolved';

export const notificationEventService = {
  /**
   * Triggers a notification for a waste pickup request event.
   */
  triggerPickupEvent: async (
    userId: string,
    eventType: PickupEventType,
    pickupId: string,
    additionalData?: Record<string, string | number | boolean | null>
  ): Promise<string | null> => {
    try {
      // 1. Fetch user's notification preferences
      const preferences = await notificationRepository.getNotificationPreferences(userId);
      if (!preferences.pickupUpdates) {
        console.log(`Notifications disabled for pickup updates for user ${userId}`);
        return null;
      }

      // 2. Define standard title and body mappings for pickup events
      let title = '';
      let body = '';

      switch (eventType) {
        case 'pickup_created':
          title = 'Pickup Request Created';
          body = 'Your waste pickup request has been successfully created.';
          break;
        case 'pickup_scheduled':
          title = 'Pickup Scheduled';
          body = 'Your waste pickup has been scheduled.';
          break;
        case 'pickup_assigned':
          title = 'Driver Assigned';
          body = 'A driver has been assigned to your waste pickup.';
          break;
        case 'pickup_completed':
          title = 'Pickup Completed';
          body = 'Your waste pickup has been completed. Thank you for recycling!';
          break;
        case 'pickup_cancelled':
          title = 'Pickup Cancelled';
          body = 'Your waste pickup request has been cancelled.';
          break;
        default:
          throw new Error(`Unsupported pickup event type: ${eventType}`);
      }

      // 3. Assemble data payload
      const data: NotificationData = {
        pickupId,
        eventType,
        category: 'pickup',
        ...(additionalData || {})
      };

      // 4. Create and store notification
      return await notificationRepository.create({
        userId,
        type: eventType,
        title,
        body,
        data
      });
    } catch (error) {
      console.error(`Failed to trigger pickup event notification for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Triggers a notification for a community waste report event.
   */
  triggerReportEvent: async (
    userId: string,
    eventType: ReportEventType,
    reportId: string,
    additionalData?: Record<string, string | number | boolean | null>
  ): Promise<string | null> => {
    try {
      // 1. Fetch user's notification preferences
      const preferences = await notificationRepository.getNotificationPreferences(userId);
      if (!preferences.communityReports) {
        console.log(`Notifications disabled for community reports for user ${userId}`);
        return null;
      }

      // 2. Define standard title and body mappings for report events
      let title = '';
      let body = '';

      switch (eventType) {
        case 'report_under_review':
          title = 'Report Under Review';
          body = 'Your community waste report is now under review.';
          break;
        case 'report_verified':
          title = 'Report Verified';
          body = 'Your community waste report has been verified.';
          break;
        case 'report_rejected':
          title = 'Report Rejected';
          body = 'Your community waste report could not be verified.';
          break;
        case 'report_resolved':
          title = 'Report Resolved';
          body = 'Thank you! Your community waste report has been resolved.';
          break;
        default:
          throw new Error(`Unsupported report event type: ${eventType}`);
      }

      // 3. Assemble data payload
      const data: NotificationData = {
        reportId,
        eventType,
        category: 'community_report',
        ...(additionalData || {})
      };

      // 4. Create and store notification
      return await notificationRepository.create({
        userId,
        type: eventType,
        title,
        body,
        data
      });
    } catch (error) {
      console.error(`Failed to trigger report event notification for user ${userId}:`, error);
      throw error;
    }
  }
};
