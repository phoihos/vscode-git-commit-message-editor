import * as vscode from 'vscode';

import { Command } from '@phoihos/vsce-util';

export class TriggerSuggestCommand implements Command {
  public readonly id = 'gitCommitMessageEditor.intelliSense.command.triggerSuggest';

  constructor() {}

  public execute(beforeExecute?: () => void): void {
    beforeExecute?.();
    vscode.commands.executeCommand('editor.action.triggerSuggest');
  }
}
