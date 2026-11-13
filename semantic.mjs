export function normalize(vector) {
  if (!Array.isArray(vector) || !vector.length || !vector.every(Number.isFinite)) {
    throw new Error('Invalid embedding');
  }
  const length = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(length) || length === 0) throw new Error('Invalid embedding length');
  return vector.map(value => value / length);
}

export async function indexDocument(document, model, embed) {
  const chunks = [];
  for (let start = 0; start < document.chunks.length; start += 32) {
    const batch = document.chunks.slice(start, start + 32);
    const vectors = await embed(batch.map(chunk => document.name + '\n' + chunk.text), 'document');
    if (vectors.length !== batch.length) throw new Error('Incomplete embeddings');
    for (const [index, chunk] of batch.entries()) {
      const vector = normalize(vectors[index]);
      if (chunks.length && vector.length !== chunks[0].vector.length) throw new Error('Embedding dimensions changed');
      chunks.push({ ...chunk, vector });
    }
  }
  return { ...document, embeddingModel: model, chunks };
}

export async function retrieve(docs, question, previousQuestion, model, embed, minScore) {
  const indexed = docs.filter(doc => doc.embeddingModel === model);
  if (!indexed.length) return [];
  const input = previousQuestion && /^(?:and\b|what about\b|how about\b)/i.test(question)
    ? previousQuestion + '\n' + question : question;
  const [rawQuery] = await embed([input], 'query');
  const query = normalize(rawQuery);
  const candidates = indexed.flatMap(doc => doc.chunks.map(({ vector, ...chunk }, index) => {
    if (vector.length !== query.length) throw new Error('Embedding dimensions changed');
    const score = vector.reduce((sum, value, dimension) => sum + value * query[dimension], 0);
    return { ...chunk, document: doc.name, section: index + 1, score };
  }));
  return candidates.filter(item => item.score >= minScore).sort((a, b) => b.score - a.score)
    .slice(0, 4).map(({ score, ...item }, index) => ({ ...item, id: index + 1 }));
}
