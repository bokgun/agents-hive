import https from 'node:https';

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; first_name: string };
    text?: string;
    date: number;
  };
}

export function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

function httpsPost(
  hostname: string,
  path: string,
  body: string,
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, data }));
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

export async function sendMessage(token: string, chatId: string, text: string): Promise<boolean> {
  const MAX_LEN = 4000;

  if (text.length <= MAX_LEN) {
    return sendSingle(token, chatId, text);
  }

  // Split on newlines to avoid breaking mid-line
  const chunks: string[] = [];
  let current = '';
  for (const line of text.split('\n')) {
    if (current.length + line.length + 1 > MAX_LEN) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current += (current ? '\n' : '') + line;
    }
  }
  if (current) chunks.push(current);

  let allOk = true;
  for (const chunk of chunks) {
    const ok = await sendSingle(token, chatId, chunk);
    if (!ok) allOk = false;
  }
  return allOk;
}

async function sendSingle(token: string, chatId: string, text: string): Promise<boolean> {
  try {
    const params = new URLSearchParams({ chat_id: chatId, text });
    const { status } = await httpsPost(
      'api.telegram.org',
      `/bot${token}/sendMessage`,
      params.toString(),
    );
    return status === 200;
  } catch {
    return false;
  }
}

export async function getUpdates(
  token: string,
  offset: number,
  timeout: number,
): Promise<TelegramUpdate[]> {
  const params = new URLSearchParams({
    offset: String(offset),
    timeout: String(timeout),
  });
  const raw = await httpsGet(
    `https://api.telegram.org/bot${token}/getUpdates?${params.toString()}`,
  );
  const data = JSON.parse(raw);
  if (data.ok && Array.isArray(data.result)) {
    return data.result as TelegramUpdate[];
  }
  return [];
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}
