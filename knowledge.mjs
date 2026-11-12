const stopwords = new Set('a an and are as at be by can could did do does for from had has have how i if in is it me my of on or our should that the their them then there these they this those to was were what when where which who why will with would you your'.split(' '));

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

function terms(value) {
  return [...new Set((value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [])
    .map(word => word.length > 4 ? word.replace(/(?:ing|ed|s)$/, '') : word)
    .filter(word => word.length > 1 && !stopwords.has(word)))];
}

export function retrieve(docs, question, previousQuestion) {
  const query = terms(question);
  if (!query.length) return [];
  const context = terms(previousQuestion);
  const candidates = docs.flatMap(doc => doc.chunks.map((chunk, index) => ({
    ...chunk, document: doc.name, section: index + 1, words: new Set(terms(chunk.text + ' ' + doc.name))
  })));
  const weights = new Map(query.map(word => [
    word, Math.log(1 + candidates.length / (1 + candidates.filter(item => item.words.has(word)).length))
  ]));
  return candidates.map(({ words, ...item }) => {
    const matches = query.filter(word => words.has(word));
    const coverage = matches.length / query.length;
    const score = matches.reduce((sum, word) => sum + weights.get(word), 0)
      + context.filter(word => words.has(word)).length * 0.12;
    return { ...item, coverage, score };
  }).filter(item => item.coverage >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4).map(({ coverage, score, ...item }, index) => ({ ...item, id: index + 1 }));
}

export function summarizeLibrary(docs) {
  if (!docs.length) {
    return { answer: 'Upload a file first, then ask me to summarize it.', sources: [], mode: 'unanswered' };
  }

  const sources = docs.map((doc, index) => {
    const chunk = doc.chunks[0];
    const opening = chunk.text.match(/^.{50,280}?[.!?](?=\s|$)/)?.[0];
    const preview = opening || chunk.text.split(/\s+/).slice(0, 34).join(' ');
    return { ...chunk, document: doc.name, section: 1, id: index + 1, preview };
  });
  const overview = sources.map(source =>
    '[' + source.id + '] ' + source.document + '\n' + source.preview +
    (source.text.length > source.preview.length && !/[.!?]$/.test(source.preview) ? '…' : '')
  );
  return { answer: 'Here’s an overview of the uploaded files. Open a source for more context.\n\n' + overview.join('\n\n'), sources, mode: 'overview' };
}
