import * as vscode from 'vscode';

import { Command } from '@phoihos/vsce-util';

const _TRAILING_TEXT_REGEX = /^:[: ]*/;

export class FormatSeparatorCommand implements Command {
  public readonly id = 'gitCommitMessageEditor.intelliSense.command.formatSeparator';

  constructor() {}

  public async execute(document: vscode.TextDocument, position: vscode.Position): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor === undefined) return;
    if (editor.document !== document) return;

    const line = document.lineAt(position.line);
    const trailingText = line.text.slice(position.character);

    const match = trailingText.match(_TRAILING_TEXT_REGEX);
    if (match === null) return;

    const endPosition = position.translate(0, match[0].length);
    const insertRange = new vscode.Range(position, endPosition);
    const insertOptions = { undoStopBefore: false, undoStopAfter: true };

    await editor.insertSnippet(new vscode.SnippetString(': '), insertRange, insertOptions);
  }
}
