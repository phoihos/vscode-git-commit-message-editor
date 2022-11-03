import { GitRepository, GitCommit, GitIssue } from '../interface';
import {
  GitDataProvider,
  GitDataQuery,
  GitCommitListQuery,
  GitCommitQuery,
  GitIssueListQuery,
  GitIssueQuery
} from '../interface';

import { GitCommitBase, extendCommits } from './gitLocalCommit';

class GitLocalDataProvider implements GitDataProvider {
  public readonly host = '';

  private readonly _cache = new Map<string, Promise<any[]>>();

  public getCommits(query: GitCommitListQuery): Promise<GitCommit[]> {
    const { repository, maxEntries } = query;
    const queryString = `commits?count=${maxEntries}`;

    return this._getOrFetch(repository, queryString, () => {
      return repository
        .log({ maxEntries })
        .catch((err): GitCommitBase[] => {
          if (/your current branch '.+' does not have any commits yet/.test(err.stderr || '')) {
            return [];
          }
          throw err;
        })
        .then((commits): GitCommit[] => {
          return extendCommits(commits);
        });
    });
  }

  public async getCommit(query: GitCommitQuery): Promise<GitCommit | undefined> {
    const { repository, hash } = query;

    const key = repository.rootUri.path + '/commits';

    for (const superKey of this._cache.keys()) {
      if (superKey.includes(key)) {
        let value = this._cache.get(superKey);
        if (value !== undefined) {
          const commits: GitCommit[] = await value;
          const commit = commits.find((e) => e.hashShort === hash || e.hash === hash);
          if (commit !== undefined) return commit;
        }
      }
    }

    return repository
      .getCommit(hash)
      .catch((err): undefined => {
        if (/^fatal: ambiguous argument/.test(err.stderr || '')) {
          return undefined;
        }
        throw err;
      })
      .then((commit): GitCommit | undefined => {
        return commit !== undefined ? extendCommits([commit])[0] : undefined;
      });
  }

  public getIssues(_query: GitIssueListQuery): Promise<GitIssue[]> {
    return Promise.resolve([]);
  }

  public getIssue(_query: GitIssueQuery): Promise<GitIssue | undefined> {
    return Promise.resolve(undefined);
  }

  public clearCache(query: GitDataQuery): void {
    const key = query.repository.rootUri.path;

    for (const superKey of this._cache.keys()) {
      if (superKey.includes(key)) {
        this._cache.delete(superKey);
      }
    }
  }

  public dispose(): void {}

  private _getOrFetch<T>(
    repository: GitRepository,
    query: string,
    fetch: () => Promise<T[]>
  ): Promise<T[]> {
    const key = repository.rootUri.path + '/' + query;

    let value = this._cache.get(key);
    if (value === undefined) {
      value = fetch();
      this._cache.set(key, value);
    }

    return value;
  }
}

export default function getGitLocalDataProvider(): GitDataProvider {
  return new GitLocalDataProvider();
}
