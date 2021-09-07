import { IGitRepository, IGitCommit, IGitIssue } from '../interface';
import {
  IGitDataProvider,
  IGitDataQuery,
  IGitCommitListQuery,
  IGitCommitQuery,
  IGitIssueListQuery,
  IGitIssueQuery
} from '../interface';

import { IGitCommitBase, extendCommits } from './gitLocalCommit';

class GitLocalDataProvider implements IGitDataProvider {
  public readonly host = '';

  private readonly _cache = new Map<string, Promise<any[]>>();

  public getCommits(query: IGitCommitListQuery): Promise<IGitCommit[]> {
    const { repository, maxEntries } = query;

    return this._getOrFetch(repository, () => {
      return repository
        .log({ maxEntries })
        .catch((err): IGitCommitBase[] => {
          if (/your current branch '.+' does not have any commits yet/.test(err.stderr || '')) {
            return [];
          }
          throw err;
        })
        .then((commits): IGitCommit[] => {
          return extendCommits(commits);
        });
    });
  }

  public async getCommit(query: IGitCommitQuery): Promise<IGitCommit | undefined> {
    const { repository, hash } = query;

    const key = repository.rootUri.path;

    let value = this._cache.get(key);
    if (value !== undefined) {
      const commits: IGitCommit[] = await value;
      const commit = commits.find((e) => e.hashShort === hash || e.hash === hash);
      if (commit !== undefined) return commit;
    }

    return repository
      .getCommit(hash)
      .catch((err): undefined => {
        if (/^fatal: ambiguous argument/.test(err.stderr || '')) {
          return undefined;
        }
        throw err;
      })
      .then((commit): IGitCommit | undefined => {
        return commit !== undefined ? extendCommits([commit])[0] : undefined;
      });
  }

  public getIssues(_query: IGitIssueListQuery): Promise<IGitIssue[]> {
    return Promise.resolve([]);
  }

  public getIssue(_query: IGitIssueQuery): Promise<IGitIssue | undefined> {
    return Promise.resolve(undefined);
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
