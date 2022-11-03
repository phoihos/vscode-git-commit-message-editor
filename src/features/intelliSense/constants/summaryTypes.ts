export interface SummaryType {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly emojis: string[];
  readonly sort: number;
}

/**
 * @see https://github.com/commitizen/conventional-commit-types/blob/master/index.json
 */
export const summaryTypes: SummaryType[] = (function () {
  const summaryTypes: SummaryType[] = [
    {
      type: 'feat',
      title: '',
      description: '',
      emojis: ['✨'],
      sort: 1
    },
    {
      type: 'fix',
      title: '',
      description: '',
      emojis: ['🐛', '🩹', '🚑️'],
      sort: 2
    },
    {
      type: 'docs',
      title: '',
      description: '',
      emojis: ['📝', '✏️'],
      sort: 3
    },
    {
      type: 'style',
      title: '',
      description: '',
      emojis: ['🎨', '💄'],
      sort: 4
    },
    {
      type: 'refactor',
      title: '',
      description: '',
      emojis: ['♻️'],
      sort: 5
    },
    {
      type: 'perf',
      title: '',
      description: '',
      emojis: ['⚡️'],
      sort: 6
    },
    {
      type: 'test',
      title: '',
      description: '',
      emojis: ['✅', '🧪'],
      sort: 7
    },
    {
      type: 'build',
      title: '',
      description: '',
      emojis: ['📦️'],
      sort: 8
    },
    {
      type: 'ci',
      title: '',
      description: '',
      emojis: ['👷', '💚'],
      sort: 9
    },
    {
      type: 'chore',
      title: '',
      description: '',
      emojis: ['🔧', '🔨', '🍱'],
      sort: 10
    },
    {
      type: 'revert',
      title: '',
      description: '',
      emojis: ['⏪️', '🗑️'],
      sort: 11
    },
    {
      type: 'wip',
      title: 'Work In Progress',
      description: 'A commit that will be squashed later',
      emojis: ['🚧'],
      sort: 98
    },
    {
      type: 'initial',
      title: 'Initial',
      description: 'Initial commit',
      emojis: ['🎉'],
      sort: 99
    }
  ];

  interface CommitizenTypes {
    [key: string]: Partial<SummaryType>;
  }
  const commitizenTypes = require('conventional-commit-types').types as CommitizenTypes;

  return summaryTypes.map((e): SummaryType => {
    return { ...e, ...commitizenTypes[e.type] };
  });
})();
