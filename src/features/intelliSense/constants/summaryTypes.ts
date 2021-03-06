export interface ISummaryType {
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly emojis: string[];
  readonly sort: number;
}

/**
 * @see https://github.com/commitizen/conventional-commit-types/blob/master/index.json
 */
export const summaryTypes: ISummaryType[] = (function () {
  const summaryTypes: ISummaryType[] = [
    {
      type: 'feat',
      title: '',
      description: '',
      emojis: ['โจ'],
      sort: 1
    },
    {
      type: 'fix',
      title: '',
      description: '',
      emojis: ['๐', '๐ฉน', '๐๏ธ'],
      sort: 2
    },
    {
      type: 'docs',
      title: '',
      description: '',
      emojis: ['๐', 'โ๏ธ'],
      sort: 3
    },
    {
      type: 'style',
      title: '',
      description: '',
      emojis: ['๐จ', '๐'],
      sort: 4
    },
    {
      type: 'refactor',
      title: '',
      description: '',
      emojis: ['โป๏ธ'],
      sort: 5
    },
    {
      type: 'perf',
      title: '',
      description: '',
      emojis: ['โก๏ธ'],
      sort: 6
    },
    {
      type: 'test',
      title: '',
      description: '',
      emojis: ['โ', '๐งช'],
      sort: 7
    },
    {
      type: 'build',
      title: '',
      description: '',
      emojis: ['๐ฆ๏ธ'],
      sort: 8
    },
    {
      type: 'ci',
      title: '',
      description: '',
      emojis: ['๐ท', '๐'],
      sort: 9
    },
    {
      type: 'chore',
      title: '',
      description: '',
      emojis: ['๐ง', '๐จ', '๐ฑ'],
      sort: 10
    },
    {
      type: 'revert',
      title: '',
      description: '',
      emojis: ['โช๏ธ', '๐๏ธ'],
      sort: 11
    },
    {
      type: 'wip',
      title: 'Work In Progress',
      description: 'A commit that will be squashed later',
      emojis: ['๐ง'],
      sort: 98
    },
    {
      type: 'initial',
      title: 'Initial',
      description: 'Initial commit',
      emojis: ['๐'],
      sort: 99
    }
  ];

  interface ICommitizenTypes {
    [key: string]: Partial<ISummaryType>;
  }
  const commitizenTypes = require('conventional-commit-types').types as ICommitizenTypes;

  return summaryTypes.map((e): ISummaryType => {
    return { ...e, ...commitizenTypes[e.type] };
  });
})();
