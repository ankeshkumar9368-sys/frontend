import { NextResponse } from 'next/server';
import { admin } from '../../../../lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { title, body, userIds } = await req.json();

    if (!title || !body || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Missing required fields (title, body, userIds)' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const tokens: string[] = [];

    // Fetch FCM tokens for the specified users
    for (const userId of userIds) {
      if (userId === 'all') {
        // If broadcasting to all users, we might need a different strategy,
        // but for now let's query all users with an fcmToken
        const usersSnapshot = await db.collection('users').where('fcmToken', '!=', null).get();
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.fcmToken) {
            tokens.push(data.fcmToken);
          }
        });
        break; // No need to check individual users if 'all' is passed
      } else {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.fcmToken) {
            tokens.push(data.fcmToken);
          }
        }
      }
    }

    if (tokens.length === 0) {
      return NextResponse.json({ success: true, message: 'No valid FCM tokens found for target users.', count: 0 });
    }

    // Send multicast message
    const message = {
      notification: {
        title,
        body,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    return NextResponse.json({
      success: true,
      message: `Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`,
      count: response.successCount
    });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
