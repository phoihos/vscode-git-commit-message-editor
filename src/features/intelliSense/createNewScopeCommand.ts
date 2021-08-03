import * as vscode from 'vscode';

import { ICommand } from '@phoihos/vsce-util';

import { ISummaryScope, IConfiguration } from '../../configuration';

export class CreateNewScopeCommand implements ICommand {
  public readonly id = 'gitCommitMessageEditor.intelliSense.command.createNewScope';

  private readonly _scopeRangeRegex: RegExp;
  private readonly _config: IConfiguration;

  constructor(scopeRangeRegex: RegExp, config: IConfiguration) {
    this._scopeRangeRegex = scopeRangeRegex;
    this._config = config;
  }

  async execute(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;

    const userScopes = this._config.userScopes;

    const scope = await vscode.window.showInputBox(this._getScopeInputBoxOptions(userScopes));
    if (scope === undefined) return;

    const desc = await vscode.window.showInputBox(this._getDescInputBoxOptions(scope));
    if (desc === undefined) return;

    userScopes.push({ scope, description: desc.length > 0 ? desc.trim() : undefined });
    await this._config.updateUserScopes(userScopes);

    const document = editor.document;
    const position = editor.selection.start;
    const insertRange = document.getWordRangeAtPosition(position, this._scopeRangeRegex);

    await editor.insertSnippet(new vscode.SnippetString('(' + scope + ')'), insertRange);
  }

  private _getScopeInputBoxOptions(scopes: ISummaryScope[]): vscode.InputBoxOptions {
    return {
      placeHolder: 'Input new scope value',
      validateInput: (value) => {
        if (value.length === 0) return 'Not allow empty value';

        const lowerScope = value.trim().toLowerCase();
        if (lowerScope.length === 0) return 'Not allow only whitespaces';

        if (scopes.some((e) => e.scope.toLowerCase() === lowerScope)) return 'Already exists';

        return /^[\w\-\.]+$/.test(lowerScope)
          ? undefined
          : 'Allow only words, underscores, hyphens and dots';
      }
    };
  }

  private _getDescInputBoxOptions(scope: string): vscode.InputBoxOptions {
    return {
      placeHolder: '(optional) Input the description for',
      prompt: `scope: "${scope}"`,
      validateInput: (value) => {
        if (value.length === 0) return undefined;

        const desc = value.trim();
        if (desc.length === 0) return 'Not allow only whitespaces';

        return undefined;
      }
    };
  }
}
