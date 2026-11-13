import { createHmac, timingSafeEqual } from 'node:crypto';
import { BlobError, head, put } from '@vercel/blob';
import { waitUntil } from '@vercel/functions';

async function claimEvent(eventId) {
  const path = 'reviewer-help/slack-events/' + eventId;
  try {
    await put(path, 'received', { access: 'private', allowOverwrite: false, ttlDays: 1 });
    return true;
  } catch (error) {
    if (!(error instanceof BlobError)) throw error;
    // A competing delivery may already have claimed this event.
    await head(path);
    return false;
  }
}

async function reply(event, text, token) {
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channel: event.channel, thread_ts: event.thread_ts || event.ts,
      text, mrkdwn: false, unfurl_links: false, unfurl_media: false
    }),
    signal: AbortSignal.timeout(6000)
  });
  if (!response.ok || !(await response.json()).ok) throw new Error('Slack reply failed.');
}

function formatAnswer(result) {
  const references = result.sources.map(source =>
    '[' + source.id + '] ' + source.document + (source.page ? ', page ' + source.page : ', passage ' + source.section)
  );
  return result.answer + (references.length ? '\n\nSources\n' + references.join('\n') : '');
}

export async function handleSlack(req, res, readBody, answer) {
  const secret = process.env.SLACK_SIGNING_SECRET;
  const token = process.env.SLACK_BOT_TOKEN;
  const team = process.env.SLACK_TEAM_ID;
  const channel = process.env.SLACK_CHANNEL_ID;
  if (!secret || !token || !team || !channel) return res.status(503).json({ error: 'Slack setup is incomplete.' });

  const timestamp = req.headers['x-slack-request-timestamp'];
  const signature = req.headers['x-slack-signature'];
  if (typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) ||
      Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 ||
      typeof signature !== 'string' || !/^v0=[a-f0-9]{64}$/.test(signature)) {
    return res.status(401).end();
  }

  // Slack signs the original request bytes, before JSON parsing.
  const raw = await readBody(req, 64 * 1024, true);
  const expected = 'v0=' + createHmac('sha256', secret).update('v0:' + timestamp + ':').update(raw).digest('hex');
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return res.status(401).end();

  let payload;
  try { payload = JSON.parse(raw); } catch { return res.status(400).end(); }
  if (payload?.type === 'url_verification' && typeof payload.challenge === 'string') {
    return res.status(200).json({ challenge: payload.challenge });
  }
  const event = payload?.event;
  if (payload?.type !== 'event_callback' || payload.team_id !== team ||
      payload.is_ext_shared_channel || event?.type !== 'app_mention' ||
      event.channel !== channel || event.bot_id || event.subtype || !/^Ev[A-Z0-9]+$/.test(payload.event_id || '') ||
      typeof event.text !== 'string' || typeof event.ts !== 'string') {
    return res.status(200).end();
  }

  waitUntil((async () => {
    try {
      if (!await claimEvent(payload.event_id)) return;
      const question = event.text.replace(/<@[A-Z0-9]+(?:\|[^>]+)?>/g, '').trim();
      let text = 'Tag me with a question of up to 1,500 characters.';
      if (question && question.length <= 1500) {
        try { text = formatAnswer(await answer(question)); }
        catch { text = 'I couldn’t search the document library right now. Try again shortly.'; }
      }
      await reply(event, text, token);
    } catch (error) {
      console.error('Slack event failed:', error.name);
    }
  })());
  return res.status(200).end();
}
