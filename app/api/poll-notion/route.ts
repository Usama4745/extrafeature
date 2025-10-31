import { NextResponse } from 'next/server';
import { getFixedTickets, markAsNotified } from '@/lib/notion';
import { addNoteToConversation } from '@/lib/intercom';
import { postToSlack } from '@/lib/slack';

export async function GET() {
  try {
    const tickets = await getFixedTickets();

    for (const ticket of tickets) {
      const slackMessage = `Bug fixed! *${ticket.title}*\nDescription: ${ticket.description}\nNotion: https://notion.so/${ticket.id.replace(/-/g, '')}v`;
      
      await postToSlack(process.env.SLACK_CHANNEL!, slackMessage);

      const intercomNote = `Bug fixed and notified via Slack! Notion ticket: https://notion.so/${ticket.id.replace(/-/g, '')}v`;
      await addNoteToConversation(ticket.intercomId, intercomNote);

      await markAsNotified(ticket.id);

      console.log(`Notified for ticket ${ticket.id}`);
    }

    return NextResponse.json({ processed: tickets.length });
  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}