import * as vscode from 'vscode';

import { IGitService } from '../../gitService';

import { ICommand } from '@phoihos/vsce-util';

export class OpenEditorCommand implements ICommand {
  public readonly id = 'gitCommitMessageEditor.editor.command.openEditor';

  private readonly _scheme: string;
  private readonly _git: IGitService;

  constructor(scheme: string, git: IGitService) {
    this._scheme = scheme;
    this._git = git;
  }

  public async execute(): Promise<void> {
    if (this._git.api === undefined) return;

    const repository =
      this._git.api.repositories.find((e) => e.ui.selected) ?? this._git.api.repositories[0];
    if (repository === undefined) return;

    const path = repository.rootUri.path + '/.git/COMMIT_EDITMSG';
    const uri = vscode.Uri.file(path).with({ scheme: this._scheme });

    return vscode.commands.executeCommand('vscode.open', uri, { preview: false });
  }
}
