import { NextRequest, NextResponse } from 'next/server';
import CryptoJS from 'crypto-js';
import { getConversationDetails, addNoteToConversation } from '@/lib/intercom';
import { createBugTicket } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Hub-Signature') || '';
    const webhookSecret = process.env.INTERCOM_WEBHOOK_SECRET;

    // Optional: Verify signature
    if (webhookSecret) {
        const expectedSig: string = `sha1=${CryptoJS.HmacSHA1(body, webhookSecret).toString(CryptoJS.enc.Hex)}`;
              
        if (signature !== expectedSig) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(body);
    const topic = payload.topic;

    // Listen for conversation_part.tag.created with tag 'bug'
    if (topic === 'conversation_part.tag.created' && payload.data.item.tag.name === 'bug') {
      const conversationId = payload.data.item.conversation_id;
      const conversation = await getConversationDetails(conversationId.toString());

      // Extract title and description (customize based on your data)
      const title = conversation.assignee ? `Bug reported by ${conversation.contacts[0]?.name || 'User'}` : 'Bug Report';
      const description = `Conversation ID: ${conversationId}\n${conversation.conversation_parts?.[0]?.body?.plain || 'No details'}`;

      const notionId = await createBugTicket({
        intercomId: conversationId.toString(),
        title,
        description,
      });

      console.log(`Created Notion ticket ${notionId} for Intercom ${conversationId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}