import { ISummaryType } from './summaryTypes';

export interface IFooterType extends ISummaryType {
  readonly separator: string;
  readonly regex?: string;
}

export const footerTypes: IFooterType[] = [
  {
    type: 'Closes',
    title: 'Referencing issues',
    description: 'A code change that related issues to close',
    emojis: ['#️⃣'],
    sort: 97,
    separator: ' #'
  },
  {
    type: 'Refs',
    title: 'Referencing commits',
    description: 'A code change that related other commits',
    emojis: ['🧲'],
    sort: 98,
    separator: ': '
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
