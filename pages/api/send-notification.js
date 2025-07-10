import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, body, data, tokens, targetRoles } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Valid tokens array is required' });
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      tokens: tokens.filter(token => token && token.trim() !== ''), // Filter out empty tokens
    };

    // Add web-specific configuration
    message.webpush = {
      notification: {
        title,
        body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'workshop-notification',
        requireInteraction: true,
        actions: [
          {
            action: 'view',
            title: 'View'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      }
    };

    // Add Android-specific configuration
    message.android = {
      notification: {
        title,
        body,
        icon: 'ic_notification',
        color: '#4F46E5',
        sound: 'default',
        channelId: 'workshop_notifications'
      },
      priority: 'high'
    };

    const response = await admin.messaging().sendMulticast(message);

    console.log('Notification sent successfully:', response);

    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error?.message
          });
        }
      });
      
      console.log('Failed tokens:', failedTokens);
    }

    res.status(200).json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
}