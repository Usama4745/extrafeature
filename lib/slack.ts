import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function postToSlack(channel: string, message: string) {
  const response = await slack.chat.postMessage({
    channel,
    text: message,
  });
  if (!response.ok) throw new Error(`Failed to post to Slack: ${response.error}`);
}