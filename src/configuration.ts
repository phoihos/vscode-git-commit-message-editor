import * as vscode from 'vscode';

import * as vsceUtil from '@phoihos/vsce-util';

export interface ISummaryScope {
  readonly scope: string;
  readonly description?: string;
}

export interface IConfiguration extends vsceUtil.IDisposable {
  readonly keepAfterSave: boolean;
  readonly recentCommitsEnabled: boolean;
  readonly recentCommitsMaxItems: number;
  readonly completionEnabled: boolean;
  readonly userScopes: ISummaryScope[];
  readonly logScopesEnabled: boolean;
  readonly logScopesMaxCommits: number;
  readonly issuesPageSize: number;
  readonly commitsPageSize: number;
  readonly hoverEnabled: boolean;

  updateUserScopes(userScopes: ISummaryScope[]): Thenable<void>;
}

class Configuration extends vsceUtil.Disposable implements IConfiguration {
  private readonly _sectionPrefix = 'gitCommitMessageEditor.';

  private readonly _cache = new Map<string, any>();

  constructor() {
    super();

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(this._onDidChangeConfiguration, this)
    );
    this.register(subscriptions);
  }

  get keepAfterSave(): boolean {
    return this._getConfigValue<boolean>('editor.keepAfterSave', false);
  }

  get recentCommitsEnabled(): boolean {
    return this._getConfigValue<boolean>('codeLens.recentCommits.enabled', true);
  }

  get recentCommitsMaxItems(): number {
    return this._getConfigValue<number>('codeLens.recentCommits.maxItems', 16);
  }

  get completionEnabled(): boolean {
    return this._getConfigValue<boolean>('intelliSense.completion.enabled', true);
  }

  get userScopes(): ISummaryScope[] {
    return this._getConfigValue<ISummaryScope[]>('intelliSense.completion.scopes', []);
  }

  get logScopesEnabled(): boolean {
    return this._getConfigValue<boolean>('intelliSense.completion.logScopes.enabled', false);
  }

  get logScopesMaxCommits(): number {
    return this.recentCommitsMaxItems;
  }

  get issuesPageSize(): number {
    return this._getConfigValue<number>('intelliSense.completion.issues.pageSize', 20);
  }

  get commitsPageSize(): number {
    return this.recentCommitsMaxItems;
  }

  get hoverEnabled(): boolean {
    return this._getConfigValue<boolean>('intelliSense.hover.enabled', true);
  }

  public updateUserScopes(userScopes: ISummaryScope[]): Thenable<void> {
    return this._getConfig('intelliSense.completion').update(
      'scopes',
      userScopes,
      vscode.ConfigurationTarget.Workspace
    );
  }

  private _getConfig(section: string): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this._sectionPrefix + section);
  }

  private _getConfigValue<T>(section: string, defaultValue: T): T {
    const key = this._sectionPrefix + section;

    let value = this._cache.get(key);
    if (value === undefined) {
      const sections = section.split('.');
      const childSection = sections.pop() ?? '';
      const parentSection = sections.join('.');

      value = this._getConfig(parentSection).get<T>(childSection, defaultValue);
      this._cache.set(key, value);
    }

    return value;
  }

  private _onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent): void {
    for (const key of this._cache.keys()) {
      if (event.affectsConfiguration(key)) {
        this._cache.delete(key);
      }
    }
  }
}

export default function getConfiguration(): IConfiguration {
  return new Configuration();
}
