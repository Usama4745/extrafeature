import { Client, PageObjectResponse } from '@notionhq/client';  // Add PageObjectResponse import

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export interface BugTicket {
  id: string;
  intercomId: string;
  title: string;
  description: string;
}

export async function createBugTicket(ticket: Omit<BugTicket, 'id'>): Promise<string> {
  const response = await notion.pages.create({
    parent: { database_id: process.env.NOTION_DATABASE_ID! },
    properties: {
      Name: {
        title: [{ text: { content: ticket.title } }],
      },
      Description: {
        rich_text: [{ text: { content: ticket.description } }],
      },
      Status: {
        select: { name: 'Open' },
      },
      'Intercom ID': {
        number: parseInt(ticket.intercomId, 10),  // Assuming ID is numeric
      },
      Notified: {
        checkbox: false,
      },
    },
  });
  return response.id;
}

export async function getFixedTickets(): Promise<BugTicket[]> {
  const response = await notion.dataSources.query({
    data_source_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Fixed',
          },
        },
        {
          property: 'Notified',
          checkbox: {
            equals: false,
          },
        },
      ],
    },
  });

  // Type guard: Filter to full pages with properties (narrows to PageObjectResponse[])
  const fullPages = response.results.filter(
    (page): page is PageObjectResponse => 'properties' in page
  );

  // Optional: Log if partials were filtered (for debugging)
  if (fullPages.length < response.results.length) {
    console.warn(`Filtered ${response.results.length - fullPages.length} partial results`);
  }

  return fullPages.map((page) => {
    const props = page.properties;
    return {
      id: page.id,
      intercomId: (props['Intercom ID'] as any).number?.toString() || '',
      title: (props.Name as any).title[0]?.plain_text || '',
      description: ((props.Description as any).rich_text[0]?.plain_text || '') as string,
    };
  });
}

export async function markAsNotified(ticketId: string): Promise<void> {
  await notion.pages.update({
    page_id: ticketId,
    properties: {
      Notified: {
        checkbox: true,
      },
    },
  });
}