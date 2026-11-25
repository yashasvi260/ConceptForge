/**
 * Find a word in a WordPiece token list. Returns one group of token indexes per occurrence
 * (several indexes when the word was split into `##` pieces). Case-insensitive.
 */
export function findWord(tokens: string[], word: string): number[][] {
  const target = word.trim().toLowerCase();
  if (!target) return [];
  const hits: number[][] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i]!.startsWith("##")) continue;
    let text = tokens[i]!.toLowerCase();
    const group = [i];
    let j = i + 1;
    while (j < tokens.length && tokens[j]!.startsWith("##")) {
      text += tokens[j]!.slice(2).toLowerCase();
      group.push(j);
      j++;
    }
    if (text === target) hits.push(group);
  }
  return hits;
}
