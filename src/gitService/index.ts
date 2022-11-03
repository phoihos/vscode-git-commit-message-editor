import * as vscode from 'vscode';

import { GitExtension, API as GitAPI } from './git';
import { GitRepository, GitCommit, GitIssue } from './interface';

import * as vsceUtil from '@phoihos/vsce-util';
import { GitDataProviderProvider } from './dataProviderProvider';

export interface GitService extends vsceUtil.DisposableLike {
  readonly api: GitAPI | undefined;

  getRepository(uri: vscode.Uri): GitRepository | undefined;
  getCommits(uri: vscode.Uri, maxEntries?: number): Promise<GitCommit[]>;
  getCommit(uri: vscode.Uri, hash: string): Promise<GitCommit | undefined>;
  getIssues(uri: vscode.Uri, pagination?: { pageSize: number; page: number }): Promise<GitIssue[]>;
  getIssue(uri: vscode.Uri, number: number): Promise<GitIssue | undefined>;
  clearCache(uri: vscode.Uri): void;
}

class GitServiceImpl extends vsceUtil.Disposable implements GitService {
  private readonly _gitExtension =
    vscode.extensions.getExtension<GitExtension>('vscode.git')!.exports;

  private _gitAPI: GitAPI | undefined;
  public get api(): GitAPI | undefined {
    return this._gitAPI;
  }

  private readonly _dataProviderProvider: GitDataProviderProvider;

  constructor() {
    super();

    this._onDidChangeEnablement(this._gitExtension.enabled);
    this._dataProviderProvider = new GitDataProviderProvider();

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      this._gitExtension.onDidChangeEnablement(this._onDidChangeEnablement, this),
      this._dataProviderProvider
    );
    this.register(subscriptions);
  }

  public getRepository(uri: vscode.Uri): GitRepository | undefined {
    const lowerPath = uri.path.toLowerCase();

    return this._gitAPI?.repositories.find((e) => lowerPath.includes(e.rootUri.path.toLowerCase()));
  }

  public getCommits(uri: vscode.Uri, maxEntries?: number): Promise<GitCommit[]> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve([]);

    const [dataProvider] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getCommits({ repository, maxEntries });
  }

  public getCommit(uri: vscode.Uri, hash: string): Promise<GitCommit | undefined> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve(undefined);

    const [dataProvider] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getCommit({ repository, hash });
  }

  public getIssues(
    uri: vscode.Uri,
    pagination?: { pageSize: number; page: number }
  ): Promise<GitIssue[]> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve([]);

    const [dataProvider, remote] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getIssues({ repository, remote, pagination });
  }

  public getIssue(uri: vscode.Uri, number: number): Promise<GitIssue | undefined> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve(undefined);

    const [dataProvider, remote] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getIssue({ repository, remote, number });
  }

  public clearCache(uri: vscode.Uri): void {
    const repository = this.getRepository(uri);
    if (repository !== undefined) {
      const [dataProvider] = this._dataProviderProvider.getDataProvider(repository, uri.path);
      dataProvider.clearCache({ repository });
    }
    this._dataProviderProvider.clearCache(uri.path);
  }

  private _onDidChangeEnablement(enabled: boolean): void {
    this._gitAPI = enabled ? this._gitExtension.getAPI(1) : undefined;
  }
}

export default function getGitService(): GitService {
  return new GitServiceImpl();
}
