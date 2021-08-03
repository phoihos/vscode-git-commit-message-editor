import * as vscode from 'vscode';

import { EventListenerBase } from '@phoihos/vsce-util';
import { FormatSeparatorCommand } from './formatSeparatorCommand';

import { ELineType, getLineType } from '../parser/textDocumentParser';
import { ETokenType, parseSummary } from '../parser/textLineParser';

export class FormatSeparatorEventListener extends EventListenerBase {
  private readonly _selector = 'git-commit';

  private readonly _formatSeparatorCommandId: string;

  constructor() {
    super();

    const command = new FormatSeparatorCommand();
    this._formatSeparatorCommandId = command.id;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.commands.registerCommand(command.id, command.execute, command),
      vscode.workspace.onDidChangeTextDocument(this._onDidChangeTextDocument, this)
    );
    this.register(subscriptions);
  }

  private _onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent) {
    if (event.document.languageId !== this._selector) return;
    if (event.contentChanges.length !== 1 || event.contentChanges[0].text !== ':') return;

    const document = event.document;
    const position = event.contentChanges[0].range.start;

    const lineType = getLineType(document, position.line);

    if (lineType === ELineType.Summary) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const token = parseSummary(leadingText);

      if (token.tokenTypeAt === ETokenType.Type || token.tokenTypeAt === ETokenType.Partial) {
        vscode.commands.executeCommand(this._formatSeparatorCommandId, document, position);
      }
    }
  }
}
