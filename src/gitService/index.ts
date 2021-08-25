import * as vscode from 'vscode';

import { GitExtension as IGitExtension, API as IGitAPI } from './git';
import { IGitRepository, IGitCommit, IGitIssue } from './interface';

import * as vsceUtil from '@phoihos/vsce-util';
import { GitDataProviderProvider } from './dataProviderProvider';

export interface IGitService extends vsceUtil.IDisposable {
  readonly api: IGitAPI | undefined;

  getRepository(uri: vscode.Uri): IGitRepository | undefined;
  getCommits(uri: vscode.Uri, maxEntries?: number): Promise<IGitCommit[]>;
  getIssues(uri: vscode.Uri, pagination?: { per_page: number; page: number }): Promise<IGitIssue[]>;
  clearCache(uri: vscode.Uri): void;
}

class GitService extends vsceUtil.Disposable implements IGitService {
  private readonly _gitExtension =
    vscode.extensions.getExtension<IGitExtension>('vscode.git')!.exports;

  private _gitAPI: IGitAPI | undefined;
  public get api(): IGitAPI | undefined {
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

  public getRepository(uri: vscode.Uri): IGitRepository | undefined {
    const lowerPath = uri.path.toLowerCase();

    return this._gitAPI?.repositories.find((e) => lowerPath.includes(e.rootUri.path.toLowerCase()));
  }

  public getCommits(uri: vscode.Uri, maxEntries?: number): Promise<IGitCommit[]> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve([]);

    const [dataProvider] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getCommits({ repository, maxEntries });
  }

  public getIssues(
    uri: vscode.Uri,
    pagination?: { per_page: number; page: number }
  ): Promise<IGitIssue[]> {
    const repository = this.getRepository(uri);
    if (repository === undefined) return Promise.resolve([]);

    const [dataProvider, remote] = this._dataProviderProvider.getDataProvider(repository, uri.path);

    return dataProvider.getIssues({ repository, remote, pagination });
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

export default function getGitService(): IGitService {
  return new GitService();
}
