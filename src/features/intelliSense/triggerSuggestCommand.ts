import * as vscode from 'vscode';

import { ICommand } from '@phoihos/vsce-util';

export class TriggerSuggestCommand implements ICommand {
  public readonly id = 'gitCommitMessageEditor.intelliSense.command.triggerSuggest';

  constructor() {}

  public execute(beforeExecute?: () => void): void {
    beforeExecute?.();
    vscode.commands.executeCommand('editor.action.triggerSuggest');
  }
}
