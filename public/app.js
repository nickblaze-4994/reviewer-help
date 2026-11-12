const get = id => document.getElementById(id);
const chat = get('chat');
const question = get('question');
const send = get('send');
const clear = get('clear');
const files = get('files');
let previousQuestion = '';

async function request(path, options) {
  const response = await fetch(path, options);
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}

function authorization() {
  const token = get('passcode').value;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function refresh() {
  const { documents, mode, protected: locked } = await request('/api/library');
  get('count').textContent = documents.length;
  get('empty').hidden = documents.length > 0;
  get('passcode-label').hidden = !locked;
  get('mode').textContent = mode === 'ai' ? 'Answers use the uploaded files.' : 'Source excerpts · AI summaries are off.';
  const list = get('library');
  list.replaceChildren();
  for (const doc of documents) {
    const row = document.createElement('li');
    const label = document.createElement('span');
    label.textContent = doc.name;
    const info = document.createElement('small');
    info.textContent = new Date(doc.updatedAt).toLocaleDateString();
    label.append(info);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', 'Remove ' + doc.name);
    remove.addEventListener('click', async () => {
      if (!confirm('Remove ' + doc.name + ' from the library?')) return;
      remove.disabled = true;
      try {
        await request('/api/library/' + doc.id, { method: 'DELETE', headers: authorization() });
        get('upload-status').textContent = 'Removed ' + doc.name + '.';
        await refresh();
      } catch (error) {
        get('upload-status').textContent = error.message;
        remove.disabled = false;
      }
    });
    row.append(label, remove);
    list.append(row);
  }
}

get('upload').addEventListener('submit', event => event.preventDefault());
files.addEventListener('change', async () => {
  const selected = [...files.files];
  files.disabled = true;
  const messages = [];
  for (const file of selected) {
    get('upload-status').textContent = 'Reading ' + file.name + '…';
    try {
      await request('/api/library', {
        method: 'POST', headers: { ...authorization(), 'X-File-Name': encodeURIComponent(file.name) }, body: file
      });
      messages.push('Ready: ' + file.name);
    } catch (error) {
      messages.push(file.name + ': ' + error.message);
    }
  }
  files.value = '';
  files.disabled = false;
  try { await refresh(); } catch (error) { messages.push(error.message); }
  get('upload-status').textContent = messages.join(' · ');
});

function addMessage(value, type) {
  get('welcome').hidden = true;
  const message = document.createElement('div');
  message.className = 'message ' + type;
  message.textContent = value;
  chat.append(message);
  chat.scrollTop = chat.scrollHeight;
  return message;
}

get('ask').addEventListener('submit', async event => {
  event.preventDefault();
  const value = question.value.trim();
  if (!value || send.disabled) return;
  addMessage(value, 'user');
  question.value = '';
  send.disabled = clear.disabled = true;
  const reply = addMessage('Searching the uploaded files…', 'assistant');
  try {
    const result = await request('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: value, previousQuestion })
    });
    previousQuestion = value;
    reply.textContent = result.answer;
    for (const source of result.sources) {
      const details = document.createElement('details');
      details.open = result.mode === 'excerpts' && source.id === 1;
      const title = document.createElement('summary');
      title.textContent = '[' + source.id + '] ' + source.document + (source.page ? ' · Page ' + source.page : ' · Passage ' + source.section);
      const excerpt = document.createElement('p');
      excerpt.textContent = source.text;
      details.append(title, excerpt);
      reply.append(details);
    }
  } catch (error) { reply.textContent = error.message; }
  finally {
    send.disabled = clear.disabled = false;
    reply.scrollIntoView({ block: 'nearest' });
    question.focus();
  }
});

clear.addEventListener('click', () => {
  previousQuestion = '';
  chat.querySelectorAll('.message').forEach(message => message.remove());
  get('welcome').hidden = false;
  question.focus();
});
refresh().catch(error => { get('upload-status').textContent = error.message; });
