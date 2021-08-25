import { IGitRepository, IGitCommit, IGitIssue } from '../interface';
import { IGitDataProvider, IGitDataQuery, IGitCommitQuery, IGitIssueQuery } from '../interface';

import { IGitCommitBase, extendCommits } from './gitLocalCommit';

class GitLocalDataProvider implements IGitDataProvider {
  public readonly host = '';

  private readonly _cache = new Map<string, Promise<any[]>>();

  public getCommits(query: IGitCommitQuery): Promise<IGitCommit[]> {
    const { repository, maxEntries } = query;

    return this._getOrFetch(repository, () => {
      return repository
        .log({ maxEntries })
        .catch((err): IGitCommitBase[] => {
          if (/your current branch '.+' does not have any commits yet/.test(err.stderr ?? '')) {
            return [];
          } else {
            throw err;
          }
        })
        .then((commits): IGitCommit[] => {
          return extendCommits(commits);
        });
    });
  }

  public getIssues(_query: IGitIssueQuery): Promise<IGitIssue[]> {
    return Promise.resolve([]);
  }

  public clearCache(query: IGitDataQuery): void {
    const key = query.repository.rootUri.path;

    this._cache.delete(key);
  }

  public dispose(): void {}

  private _getOrFetch<T>(repository: IGitRepository, fetch: () => Promise<T[]>): Promise<T[]> {
    const key = repository.rootUri.path;

    let value = this._cache.get(key);
    if (value === undefined) {
      value = fetch();
      this._cache.set(key, value);
    }

    return value;
  }
}

export default function getGitLocalDataProvider(): IGitDataProvider {
  return new GitLocalDataProvider();
}
