import * as vscode from 'vscode';

import { GitService } from '../../gitService';

import { Command } from '@phoihos/vsce-util';

export class OpenEditorCommand implements Command {
  public readonly id = 'gitCommitMessageEditor.editor.command.openEditor';

  private readonly _scheme: string;
  private readonly _git: GitService;

  constructor(scheme: string, git: GitService) {
    this._scheme = scheme;
    this._git = git;
  }

  public async execute(arg: any): Promise<void> {
    if (this._git.api === undefined) return;

    let repoRootUri: vscode.Uri | undefined = undefined;

    if (typeof arg === 'object' && arg.rootUri instanceof vscode.Uri) {
      repoRootUri = arg.rootUri;
    } else {
      const uri = vscode.window.activeTextEditor?.document.uri;
      const repository =
        (uri !== undefined ? this._git.getRepository(uri) : undefined) ??
        this._git.api.repositories.find((e) => e.ui.selected) ??
        this._git.api.repositories[0];

      repoRootUri = repository?.rootUri;
    }

    if (repoRootUri === undefined) return;

    const path = repoRootUri.path + '/.git/COMMIT_EDITMSG';
    const uri = vscode.Uri.file(path).with({ scheme: this._scheme });

    return vscode.commands.executeCommand('vscode.open', uri, { preview: false });
  }
}
