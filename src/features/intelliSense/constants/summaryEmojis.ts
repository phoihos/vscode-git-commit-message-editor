export interface SummaryEmoji {
  readonly emoji: string;
  readonly code: string;
  readonly description: string;
}

/**
 * @see https://github.com/carloscuesta/gitmoji/blob/master/src/data/gitmojis.json
 */
export const summaryEmojis = require('gitmojis').gitmojis as SummaryEmoji[];
