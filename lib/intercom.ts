const INTERCOM_BASE_URL = 'https://api.intercom.io';

export async function getConversationDetails(conversationId: string) {
  const response = await fetch(`${INTERCOM_BASE_URL}/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch conversation: ${response.status}`);
  return response.json();
}

export async function addNoteToConversation(conversationId: string, note: string) {
  const response = await fetch(`${INTERCOM_BASE_URL}/conversations/${conversationId}/parts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.INTERCOM_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message_type: 'note',
      body: note,
    }),
  });
  if (!response.ok) throw new Error(`Failed to add note: ${response.status}`);
}