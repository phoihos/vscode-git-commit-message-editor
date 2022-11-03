import * as vscode from 'vscode';

import { GitRepository, GitRemote, GitDataProvider } from './interface';

import * as vsceUtil from '@phoihos/vsce-util';
import getGitLocalDataProvider from './local/gitLocalDataProvider';
import getGitHubDataProvider from './github/githubDataProvider';
import getOriginRemote from './remoteHelper';

export type GitDataProviderState = [GitDataProvider, GitRemote?];

export class GitDataProviderProvider extends vsceUtil.Disposable {
  private readonly _dataProviders: GitDataProvider[];
  private readonly _fallbackProvider: GitDataProvider;

  private readonly _cache = new Map<string, GitDataProviderState>();

  constructor() {
    super();

    const localDataProvider = getGitLocalDataProvider();
    this._dataProviders = [getGitHubDataProvider(localDataProvider)];
    this._fallbackProvider = localDataProvider;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(...this._dataProviders);
    subscriptions.push(this._fallbackProvider);
    this.register(subscriptions);
  }

  public getDataProvider(repository: GitRepository, cacheKey: string): GitDataProviderState {
    let dataProvider = this._cache.get(cacheKey);
    if (dataProvider === undefined) {
      dataProvider = this._resolveDataProvider(repository);
      if (dataProvider !== undefined) {
        this._cache.set(cacheKey, dataProvider);
      } else {
        dataProvider = [this._fallbackProvider];
      }
    }

    return dataProvider;
  }

  public clearCache(cacheKey: string): void {
    this._cache.delete(cacheKey);
  }

  private _resolveDataProvider(repository: GitRepository): GitDataProviderState | undefined {
    const remote = getOriginRemote(repository);
    if (remote === undefined) return undefined;

    const dataProvider = this._dataProviders.find((e) => e.host === remote.host);
    if (dataProvider === undefined) return [this._fallbackProvider];

    return [dataProvider, remote];
  }
}
