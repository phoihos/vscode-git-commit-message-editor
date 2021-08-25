import { ISummaryType } from './summaryTypes';

export interface IFooterType extends ISummaryType {
  readonly separator: string;
  readonly regex?: string;
  readonly descType?: 'issue' | 'commit';
}

export const footerTypes: IFooterType[] = [
  {
    type: 'Closes',
    title: 'Referencing issues',
    description: 'A code change that related issues to close (for example, Closes #133)',
    emojis: ['🔗'],
    sort: 97,
    separator: ' #',
    descType: 'issue'
  },
  {
    type: 'Refs',
    title: 'Referencing commits',
    description: 'A code change that related other commits (for example, Refs: 676104e, a215868)',
    emojis: ['🧲'],
    sort: 98,
    separator: ': ',
    descType: 'commit'
  },
  {
    type: 'BREAKING CHANGE',
    title: 'Breaking changes',
    description: 'A code change that causes other features to fail',
    emojis: ['💥'],
    sort: 99,
    separator: ': ',
    regex: '\\w+ ?\\w*[: ]*'
  }
];
