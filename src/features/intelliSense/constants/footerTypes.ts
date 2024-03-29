import { SummaryType } from './summaryTypes';

export interface FooterType extends SummaryType {
  readonly separator: string;
  readonly regex?: string;
  readonly descType?: 'issue' | 'commit';
}

export const footerTypes: FooterType[] = [
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

export function isIssueTriggerable(type: string): boolean {
  const found = footerTypes.find((e) => e.type === type);

  return found?.descType === 'issue';
}

export function isCommitTriggerable(type: string): boolean {
  const found = footerTypes.find((e) => e.type === type);

  return found?.descType === 'commit';
}
