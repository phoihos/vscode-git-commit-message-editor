import * as vscode from 'vscode';
import { Octokit as GitHubAPI, RestEndpointMethodTypes } from '@octokit/rest';
import { RequestError as GitHubRequestError } from '@octokit/request-error';

import { GitRepository, GitCommit, GitIssue } from '../interface';
import {
  GitDataProvider,
  GitDataQuery,
  GitCommitListQuery,
  GitCommitQuery,
  GitIssueListQuery,
  GitIssueQuery
} from '../interface';

import * as vsceUtil from '@phoihos/vsce-util';
import { GitHubIssueModel, translateIssues } from './githubIssue';

type GitHubIssueListParams = RestEndpointMethodTypes['issues']['listForRepo']['parameters'];
type GitHubIssueParams = RestEndpointMethodTypes['issues']['get']['parameters'];

const _GITHUB_AUTH_PROVIDER_ID = 'github';
// The GitHub Authentication Provider accepts the scopes described here:
// https://developer.github.com/apps/building-oauth-apps/understanding-scopes-for-oauth-apps/
const _SCOPES = ['read:user', 'user:email', 'repo'];

class GitHubDataProvider extends vsceUtil.Disposable implements GitDataProvider {
  public readonly host = 'github.com';

  private readonly _fallbackProvider: GitDataProvider;

  private _authedAPI: GitHubAPI | undefined = undefined;
  private readonly _fallbackAPI = new GitHubAPI();
  private readonly _cache = new Map<string, Promise<any[]>>();

  constructor(fallbackProvider: GitDataProvider) {
    super();

    this._fallbackProvider = fallbackProvider;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(vscode.authentication.onDidChangeSessions(this._onDidChangeSessions, this));
    this.register(subscriptions);
  }

  public async getAPI(): Promise<GitHubAPI> {
    return (await this._ensureAPI()) ?? this._fallbackAPI;
  }

  public getCommits(query: GitCommitListQuery): Promise<GitCommit[]> {
    return this._fallbackProvider.getCommits(query);
  }

  public getCommit(query: GitCommitQuery): Promise<GitCommit | undefined> {
    return this._fallbackProvider.getCommit(query);
  }

  public async getIssues(query: GitIssueListQuery): Promise<GitIssue[]> {
    const remote = query.remote;
    if (remote === undefined) {
      return this._fallbackProvider.getIssues(query);
    }

    const repository = query.repository;
    const pagination = query.pagination ?? { pageSize: 20, page: 1 };
    const queryString = `issues?page=${pagination.page}`;

    const githubAPI = await this.getAPI();

    return this._getOrFetch<GitIssue>(repository, queryString, () => {
      // see: https://octokit.github.io/rest.js/v18#issues-list-for-repo
      // see: https://docs.github.com/en/rest/reference/issues#list-repository-issues
      const params: GitHubIssueListParams = {
        owner: remote.owner,
        repo: remote.repo,
        state: 'open',
        per_page: pagination.pageSize,
        page: pagination.page
      };
      const oneMoreParams: GitHubIssueListParams = {
        ...params,
        per_page: 1,
        page: pagination.pageSize * pagination.page + 1
      };

      return Promise.all([
        githubAPI.rest.issues.listForRepo(params),
        githubAPI.rest.issues.listForRepo(oneMoreParams)
      ])
        .then(([response, oneMore]): GitHubIssueModel[] => {
          return response.data.concat(oneMore.data);
        })
        .catch((err): GitHubIssueModel[] => {
          if (err instanceof GitHubRequestError) {
            if (err.status === 403 && /rate limit exceeded/.test(err.message)) {
              vscode.window.showErrorMessage(
                'GitHub API rate limit exceeded, please wait and try again.' +
                  ' Or authenticate to GitHub to get a higher rate limit.'
              );
              return [];
            } else if (err.status === 404) {
              vscode.window.showErrorMessage(
                'You need to authenticate to GitHub for accessing' +
                  ` 'https://github.com/${remote.owner}/${remote.repo}' repository.`
              );
              return [];
            }
          }
          throw err;
        })
        .then((issues): GitIssue[] => {
          return translateIssues(repository, remote, issues);
        });
    });
  }

  public async getIssue(query: GitIssueQuery): Promise<GitIssue | undefined> {
    const remote = query.remote;
    if (remote === undefined) {
      return this._fallbackProvider.getIssue(query);
    }

    const repository = query.repository;
    const issueNumber = query.number;

    const key = repository.rootUri.path + '/issues';

    for (const superKey of this._cache.keys()) {
      if (superKey.includes(key)) {
        let value = this._cache.get(superKey);
        if (value !== undefined) {
          const issues: GitIssue[] = await value;
          const issue = issues.find((e) => e.number === issueNumber);
          if (issue !== undefined) return issue;
        }
      }
    }

    const githubAPI = await this.getAPI();

    // see: https://octokit.github.io/rest.js/v18#issues-get
    // see: https://docs.github.com/en/rest/reference/issues#get-an-issue
    const params: GitHubIssueParams = {
      owner: remote.owner,
      repo: remote.repo,
      issue_number: issueNumber
    };

    return githubAPI.rest.issues
      .get(params)
      .then((response): GitHubIssueModel | undefined => {
        const issue = response.data as GitHubIssueModel;
        if (issue.state !== 'open' || issue.pull_request !== undefined) {
          return undefined;
        }
        return issue;
      })
      .catch((err): undefined => {
        if (err instanceof GitHubRequestError) {
          if (err.status === 403 && /rate limit exceeded/.test(err.message)) {
            vscode.window.showErrorMessage(
              'GitHub API rate limit exceeded, please wait and try again.' +
                ' Or authenticate to GitHub to get a higher rate limit.'
            );
            return undefined;
          } else if (err.status === 301 || err.status === 404 || err.status === 410) {
            return undefined;
          }
        }
        throw err;
      })
      .then((issue): GitIssue | undefined => {
        return issue !== undefined ? translateIssues(repository, remote, [issue])[0] : undefined;
      });
  }

  public clearCache(query: GitDataQuery): void {
    const key = query.repository.rootUri.path;

    for (const superKey of this._cache.keys()) {
      if (superKey.includes(key)) {
        this._cache.delete(superKey);
      }
    }

    this._fallbackProvider.clearCache(query);
  }

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

  private async _ensureAPI(invalidate: boolean = false): Promise<GitHubAPI | undefined> {
    let accessToken: string | undefined = undefined;

    try {
      const session = await vscode.authentication.getSession(_GITHUB_AUTH_PROVIDER_ID, _SCOPES, {
        createIfNone: false
      });
      accessToken = session?.accessToken;
    } catch (err) {
      console.warn('Failed to authenticate');
      console.warn(err);
    }

    const cachedAPI = this._authedAPI;

    if (accessToken !== undefined) {
      const reusableAPI = invalidate ? undefined : this._authedAPI;
      this._authedAPI = reusableAPI ?? new GitHubAPI({ auth: accessToken });
    } else {
      this._authedAPI = undefined;
    }

    if (this._authedAPI !== cachedAPI) {
      this._cache.clear();
    }

    return this._authedAPI;
  }

  private async _onDidChangeSessions(
    event: vscode.AuthenticationSessionsChangeEvent
  ): Promise<void> {
    if (event.provider.id === _GITHUB_AUTH_PROVIDER_ID) {
      await this._ensureAPI(true);
    }
  }
}

export default function getGitHubDataProvider(
  fallbackDataProvider: GitDataProvider
): GitDataProvider {
  return new GitHubDataProvider(fallbackDataProvider);
}
