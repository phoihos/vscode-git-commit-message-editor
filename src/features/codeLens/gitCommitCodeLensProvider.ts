import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IConfiguration } from '../../configuration';

import * as vsceUtil from '@phoihos/vsce-util';
import { RecentCommitsResolver } from './recentCommitsResolver';
import { ShowRecentCommitsCommand } from './showRecentCommitsCommand';

export class GitCommitCodeLensProvider
  extends vsceUtil.Disposable
  implements vscode.CodeLensProvider
{
  private readonly _selector = 'git-commit';

  private readonly _resolver: RecentCommitsResolver;
  private readonly _showRecentCommitsCommandId: string;

  private readonly _config: IConfiguration;

  constructor(git: IGitService, config: IConfiguration) {
    super();

    this._resolver = new RecentCommitsResolver(git, config);
    const command = new ShowRecentCommitsCommand(this._resolver);
    this._showRecentCommitsCommandId = command.id;

    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.commands.registerCommand(command.id, command.execute, command),
      vscode.languages.registerCodeLensProvider(this._selector, this)
    );
    this.register(subscriptions);
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    if (this._config.recentCommitsEnabled === false) return [];

    return this._resolver
      .resolveRecentCommits(document)
      .then((recentCommits): vscode.CodeLens[] => {
        if (recentCommits === undefined) return [];

        return recentCommits.pickItems.length > 0
          ? [
              new vscode.CodeLens(recentCommits.insertRange, {
                title: 'Recent commits...',
                tooltip:
                  "Show recent commits to Choose a commit message\n· Keyboard Shortcut: Ctrl+Shift+'",
                command: this._showRecentCommitsCommandId,
                arguments: [recentCommits]
              })
            ]
          : [
              new vscode.CodeLens(recentCommits.insertRange, {
                title: 'No recent commits',
                tooltip: 'No commits could be found',
                command: ''
              })
            ];
      });
  }

  resolveCodeLens(
    codeLens: vscode.CodeLens,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens> {
    return codeLens;
  }
}
