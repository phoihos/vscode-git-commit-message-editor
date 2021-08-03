import * as vscode from 'vscode';

import { ICommand } from '@phoihos/vsce-util';

import { IRecentCommits, RecentCommitsResolver } from './recentCommitsResolver';

export class ShowRecentCommitsCommand implements ICommand {
  public readonly id = 'gitCommitMessageEditor.codeLens.command.showRecentCommits';

  private readonly _resolver: RecentCommitsResolver;

  constructor(resolver: RecentCommitsResolver) {
    this._resolver = resolver;
  }

  async execute(recentCommits?: IRecentCommits): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;

    if (recentCommits === undefined) {
      recentCommits = await new Promise<IRecentCommits | undefined>(async (resolve) => {
        let fulfilled: IRecentCommits | undefined = undefined;

        const loading = vscode.window.createQuickPick();
        loading.placeholder = 'Loading...';
        loading.busy = true;
        loading.enabled = false;
        loading.onDidHide(() => {
          loading.dispose();
          resolve(fulfilled);
        });

        loading.show();

        fulfilled = await this._resolver.resolveRecentCommits(editor.document);

        loading.hide();
      });
    }
    if (recentCommits === undefined) return;

    const pickOptions = {
      placeHolder:
        recentCommits.pickItems.length > 0 ? 'Choose a commit message' : 'No commits could be found'
    };
    const pickedItem = await vscode.window.showQuickPick(recentCommits.pickItems, pickOptions);
    if (pickedItem === undefined) return;

    await editor.insertSnippet(
      new vscode.SnippetString(pickedItem.commitMessage),
      recentCommits.insertRange
    );
  }
}
