import * as vscode from 'vscode';

export interface ISummaryScope {
  readonly scope: string;
  readonly description?: string;
}

export interface IConfiguration {
  readonly keepAfterSave: boolean;
  readonly recentCommitsEnabled: boolean;
  readonly recentCommitsMaxItems: number;
  readonly completionEnabled: boolean;
  readonly userScopes: ISummaryScope[];

  updateUserScopes: (userScopes: ISummaryScope[]) => Thenable<void>;
}

class Configuration implements Partial<IConfiguration> {
  get keepAfterSave(): boolean {
    return this._getConfig('editor').get<boolean>('keepAfterSave', false);
  }

  get recentCommitsEnabled(): boolean {
    return this._getConfig('codeLens').get<boolean>('recentCommits.enabled', true);
  }

  get recentCommitsMaxItems(): number {
    return this._getConfig('codeLens').get<number>('recentCommits.maxItems', 16);
  }

  get completionEnabled(): boolean {
    return this._getConfig('intelliSense').get<boolean>('completion.enabled', true);
  }

  get userScopes(): ISummaryScope[] {
    return this._getConfig('intelliSense').get<ISummaryScope[]>('completion.scopes', []);
  }

  updateUserScopes(userScopes: ISummaryScope[]): Thenable<void> {
    return this._getConfig('intelliSense').update(
      'completion.scopes',
      userScopes,
      vscode.ConfigurationTarget.Workspace
    );
  }

  private _getConfig(feature: string): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('gitCommitMessageEditor.' + feature);
  }
}

export default function getConfiguration(): IConfiguration {
  return new Configuration();
}
