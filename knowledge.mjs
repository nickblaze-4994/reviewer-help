export function passages(pages, isPdf) {
  return pages.flatMap((page, index) => {
    const words = page.trim().split(/\s+/);
    const chunks = [];
    for (let start = 0; start < words.length && words[start]; start += 140) {
      chunks.push({ text: words.slice(start, start + 170).join(' '), page: isPdf ? index + 1 : null });
      if (start + 170 >= words.length) break;
    }
    return chunks;
  });
}

export function summarizeLibrary(docs) {
  if (!docs.length) {
    return { answer: 'Upload a file first, then ask me to summarize it.', sources: [], mode: 'unanswered' };
  }

  const sources = docs.map((doc, index) => {
    const chunk = doc.chunks[0];
    const opening = chunk.text.match(/^.{50,280}?[.!?](?=\s|$)/)?.[0];
    const preview = opening || chunk.text.split(/\s+/).slice(0, 34).join(' ');
    return { text: chunk.text, page: chunk.page, document: doc.name, section: 1, id: index + 1, preview };
  });
  const overview = sources.map(source =>
    '[' + source.id + '] ' + source.document + '\n' + source.preview +
    (source.text.length > source.preview.length && !/[.!?]$/.test(source.preview) ? '…' : '')
  );
  return { answer: 'Here’s an overview of the uploaded files. Open a source for more context.\n\n' + overview.join('\n\n'), sources, mode: 'overview' };
}
