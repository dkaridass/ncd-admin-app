# Backend Setup Guide: SMS & Email Integration

This guide outlines the steps to enable real SMS and Email sending for the **Centre de Communication**. Currently, the frontend saves messages to Firestore, but a **Cloud Function** is required to listen to these new documents and actually dispatch them via third-party providers.

## Prerequisites
1.  **Firebase Project on Blaze Plan**: External API calls (to Twilio/SendGrid) require the "Pay-as-you-go" plan.
2.  **Provider Accounts**:
    *   **Twilio**: For SMS (Account SID, Auth Token, Phone Number).
    *   **SendGrid**: For Email (API Key, Verified Sender Email).

## Step 1: Initialize Cloud Functions

If you haven't initialized functions in your project yet:

1.  Open your terminal in the project root.
2.  Run:
    ```bash
    firebase init functions
    ```
3.  Select **TypeScript**.
4.  Install dependencies:
    ```bash
    cd functions
    npm install twilio @sendgrid/mail firebase-admin firebase-functions
    ```

## Step 2: Configure Environment Variables

Securely store your API keys. Do **NOT** hardcode them.

```bash
firebase functions:config:set twilio.sid="YOUR_SID" twilio.token="YOUR_TOKEN" twilio.phone="+1234567890" sendgrid.key="YOUR_API_KEY"
```

## Step 3: Implement the Function

Replace the contents of `functions/src/index.ts` with the following logic:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as sgMail from '@sendgrid/mail';
import * as Twilio from 'twilio';

admin.initializeApp();

const db = admin.firestore();

// Initialize Clients
const twilioClient = Twilio(functions.config().twilio.sid, functions.config().twilio.token);
sgMail.setApiKey(functions.config().sendgrid.key);

export const dispatchCommunication = functions.firestore
  .document('communications/{messageId}')
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const messageId = context.params.messageId;

    if (message.status !== 'SENT') return; // Only process if intended to send
    
    // In a real scenario, you might want to switch status to 'SENDING' first, 
    // then 'SENT' or 'FAILED' after functionality.
    // However, our frontend optimistically sets it to 'SENT'. 
    
    try {
        const recipientIds = message.recipients || [];
        // Fetch user data (phone/email) from 'members' collection
        // This part requires reading recipient documents to get their contact info.
        
        const memberSnapshots = await Promise.all(
            recipientIds.map((id: string) => db.collection('members').doc(id).get())
        );
        
        const contacts = memberSnapshots.map(doc => doc.data()).filter(d => d);
        
        // 1. Send SMS
        if (message.type === 'SMS' || message.type === 'BOTH') {
            const phoneNumbers = contacts.map((c: any) => c.phone).filter((p: any) => p);
            
            // Note: Twilio usually requires individual API calls per number or a Messaging Service
            const smsPromises = phoneNumbers.map((phone: string) => 
                twilioClient.messages.create({
                    body: message.content,
                    from: functions.config().twilio.phone,
                    to: phone
                })
            );
            await Promise.all(smsPromises);
        }

        // 2. Send Email
        if (message.type === 'EMAIL' || message.type === 'BOTH') {
            const emails = contacts.map((c: any) => c.email).filter((e: any) => e);
            
            if (emails.length > 0) {
                const msg = {
                    to: emails, // SendGrid supports array of recipients (check limits) or use loop
                    from: 'noreply@yourchurch.com', // Must be verified in SendGrid
                    subject: message.subject || 'Communication NCD',
                    text: message.content,
                    html: `<p>${message.content.replace(/\n/g, '<br>')}</p>`,
                };
                await sgMail.send(msg as any); // Type casting for array support
            }
        }

        // Update status to confirmed
        await db.collection('communications').doc(messageId).update({
            deliveryStatus: {
                ...message.deliveryStatus,
                delivered: recipientIds.length, // Ideally track actual success/fail counts
            },
            status: 'SENT' 
        });

    } catch (error) {
        console.error('Error sending communication:', error);
        await db.collection('communications').doc(messageId).update({
            status: 'FAILED',
            'deliveryStatus.failed': recipientIds.length // specific error tracking is better
        });
    }
});
```

## Step 4: Deploy

Data is currently saved to Firestore. Once you deploy this function, it will start reacting to new data.

```bash
firebase deploy --only functions
```

---

**Note:** Always test with a small group of recipients (e.g., just yourself) first!
