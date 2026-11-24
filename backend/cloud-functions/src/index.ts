import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/**
 * Helper to validate caller authentication.
 * Prevents unauthenticated access to HTTPS Callable functions.
 */
function assertAuthenticated(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
}

/**
 * Helper to validate admin authorization.
 * Ensures only users with admin claims or specific roles can call sensitive functions.
 */
async function assertAdmin(context: functions.https.CallableContext) {
  assertAuthenticated(context);
  const uid = context.auth!.uid;
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();
  if (!userData || userData.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrative users are permitted to perform this action.'
    );
  }
}

/**
 * 1. reviewAggregation - Firestore trigger on review write.
 * Securely aggregates rating metrics under facilities/{facilityId} in a transaction.
 * This runs on the trusted backend and prevents clients from directly editing facility scores.
 */
export const aggregateReviews = functions.firestore
  .document('facilities/{facilityId}/reviews/{reviewId}')
  .onWrite(async (change, context) => {
    const facilityId = context.params.facilityId;
    const facilityRef = db.collection('facilities').doc(facilityId);

    try {
      await db.runTransaction(async (transaction) => {
        const reviewsSnapshot = await transaction.get(
          db.collection('facilities').doc(facilityId).collection('reviews')
        );

        let totalRating = 0;
        const reviewCount = reviewsSnapshot.size;

        reviewsSnapshot.forEach((doc) => {
          const data = doc.data();
          const rating = Number(data.rating) || 0;
          totalRating += rating;
        });

        const averageRating = reviewCount > 0 ? Number((totalRating / reviewCount).toFixed(2)) : 0;

        transaction.update(facilityRef, {
          rating: averageRating,
          reviewCount: reviewCount,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      functions.logger.info(`Successfully aggregated reviews for facility: ${facilityId}`);
    } catch (error: any) {
      functions.logger.error(`Failed to aggregate reviews for facility: ${facilityId}`, error);
    }
  });

/**
 * 2. updatePickupRequestStatus - HTTPS Callable.
 * Securely updates pickup status. Implements input validation and role-based checks.
 */
export const updatePickupRequestStatus = functions.https.onCall(async (data, context) => {
  assertAuthenticated(context);

  const { userId, requestId, newStatus } = data;

  // Enforce input validation
  if (!userId || typeof userId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid userId.');
  }
  if (!requestId || typeof requestId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid requestId.');
  }
  const allowedStatuses = ['pending', 'scheduled', 'completed', 'cancelled'];
  if (!newStatus || !allowedStatuses.includes(newStatus)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid status requested.');
  }

  // Enforce authorization: only owner or admin can update
  const callerUid = context.auth!.uid;
  const isAdmin = callerUid === 'admin_uid'; // Replace or use assertAdmin claim verification

  if (callerUid !== userId && !isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You are not authorized to update this pickup request.'
    );
  }

  const docRef = db
    .collection('users')
    .doc(userId)
    .collection('pickupRequests')
    .doc(requestId);

  try {
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Pickup request not found.');
    }

    const currentStatus = docSnap.data()?.status;

    // Validate lifecycle transition rules
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ['scheduled', 'cancelled'],
      scheduled: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    };

    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Invalid status transition from ${currentStatus} to ${newStatus}.`
      );
    }

    await docRef.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, newStatus };
  } catch (error: any) {
    functions.logger.error('Error updating pickup status:', error);
    // Sanitize error responses, do not leak backend stack traces
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'An error occurred while updating the pickup status.'
    );
  }
});

/**
 * 3. sendSystemNotification - HTTPS Callable.
 * Securely trigger push notifications. Only administrative accounts can send system messages.
 */
export const sendSystemNotification = functions.https.onCall(async (data, context) => {
  await assertAdmin(context);

  const { targetUserId, title, body, payload } = data;

  if (!targetUserId || typeof targetUserId !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid targetUserId.');
  }
  if (!title || typeof title !== 'string' || !body || typeof body !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Title and body are required.');
  }

  try {
    const devicesSnap = await db
      .collection('users')
      .doc(targetUserId)
      .collection('devices')
      .get();

    const tokens: string[] = [];
    devicesSnap.forEach((doc) => {
      const token = doc.data().pushToken;
      if (token) tokens.push(token);
    });

    if (tokens.length === 0) {
      return { success: false, reason: 'No push tokens registered for this user.' };
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data: payload || {},
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    functions.logger.info(`Successfully dispatched push messages: ${response.successCount}`);

    return { success: true, sentCount: response.successCount };
  } catch (error: any) {
    functions.logger.error('Notification dispatch error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to securely deliver system push notifications.'
    );
  }
});
