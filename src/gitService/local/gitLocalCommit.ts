import { Commit as IGitCommitBase } from '../git';
import { IGitCommit } from '../interface';

export { IGitCommitBase };

const _epochs: { label: string; seconds: number; article?: string }[] = [
  { label: 'year', seconds: 31536000 },
  { label: 'month', seconds: 2592000 },
  { label: 'day', seconds: 86400 },
  { label: 'hour', seconds: 3600, article: 'an' },
  { label: 'minute', seconds: 60 },
  { label: 'second', seconds: 1 }
];

function _convertDateToTimeAgo(date: Date | undefined): string | undefined {
  if (date === undefined) return undefined;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const epoch = _epochs.find((e) => Math.floor(seconds / e.seconds) >= 1);
  if (epoch === undefined) return '';

  const num = Math.floor(seconds / epoch.seconds);
  const time = num > 1 ? `${num} ${epoch.label}s` : `${epoch.article ?? 'a'} ${epoch.label}`;

  return time + ' ago';
}

export function extendCommits(commits: IGitCommitBase[]): IGitCommit[] {
  return commits.map((e) => {
    return {
      ...e,
      hashShort: e.hash.substring(0, 7), // short hash (7-digit)
      authorTimeAgo: _convertDateToTimeAgo(e.authorDate),
      commitTimeAgo: _convertDateToTimeAgo(e.commitDate)
    };
  });
}
