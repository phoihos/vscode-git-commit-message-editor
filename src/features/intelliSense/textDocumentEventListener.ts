import * as vscode from 'vscode';

import { IGitService } from '../../gitService';

import { EventListenerBase } from '@phoihos/vsce-util';
import { TextDocumentParserProxy, ELineType, ETokenType } from './textDocumentParserProxy';
import { parseSummary, parseFooter } from './textDocumentParserProxy';
import constants from './constants';

type EventCallback = (document: vscode.TextDocument, position: vscode.Position) => void;

export class TextDocumentEventListener extends EventListenerBase {
  private readonly _selector: string;
  private readonly _formatSeparatorCommandId: string;
  private readonly _triggerSuggestCommandId: string;
  private readonly _parserProxy: TextDocumentParserProxy;

  private readonly _eventCallbackMap = new Map<string, EventCallback>();

  private readonly _git: IGitService;

  constructor(
    selector: string,
    formatSeparatorCommandId: string,
    triggerSuggestCommandId: string,
    parserProxy: TextDocumentParserProxy,
    git: IGitService
  ) {
    super();

    this._selector = selector;
    this._formatSeparatorCommandId = formatSeparatorCommandId;
    this._triggerSuggestCommandId = triggerSuggestCommandId;
    this._parserProxy = parserProxy;

    this._git = git;

    this._eventCallbackMap.set(':', this._formatSeparator.bind(this));
    this._eventCallbackMap.set('(', this._triggerSuggestScopes.bind(this));
    this._eventCallbackMap.set('()', this._triggerSuggestScopes.bind(this));
    this._eventCallbackMap.set('#', this._triggerSuggestIssues.bind(this));

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.workspace.onDidCloseTextDocument(this._onDidCloseTextDocument, this),
      vscode.workspace.onDidChangeTextDocument(this._onDidChangeTextDocument, this)
    );
    this.register(subscriptions);
  }

  private _onDidCloseTextDocument(document: vscode.TextDocument): void {
    if (document.languageId !== this._selector) return;

    this._parserProxy.clearCache(document);
    this._git.clearCache(document.uri);
  }

  private _onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
    const document = event.document;
    if (document.languageId !== this._selector) return;

    this._parserProxy.clearCache(document);

    if (event.contentChanges.length === 1) {
      const triggerCharacter = event.contentChanges[0].text;
      const position = event.contentChanges[0].range.start;

      this._eventCallbackMap.get(triggerCharacter)?.(document, position);
    }
  }

  private _formatSeparator(document: vscode.TextDocument, position: vscode.Position): void {
    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType === ELineType.Summary) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const tokens = parseSummary(leadingText);

      if (tokens.tokenTypeAt === ETokenType.Type || tokens.tokenTypeAt === ETokenType.Partial) {
        vscode.commands.executeCommand(this._formatSeparatorCommandId, document, position);
      }
    }
  }

  private _triggerSuggestScopes(document: vscode.TextDocument, position: vscode.Position): void {
    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType & ELineType.Summary) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character + 1);
      const tokens = parseSummary(leadingText);

      if (tokens.tokenTypeAt === ETokenType.Scope) {
        vscode.commands.executeCommand(this._triggerSuggestCommandId);
      }
    }
  }

  private _triggerSuggestIssues(document: vscode.TextDocument, position: vscode.Position): void {
    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType & ELineType.Footer) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character + 1);
      const tokens = parseFooter(leadingText);

      if (tokens.tokenTypeAt === ETokenType.Desc) {
        if (constants.isIssueTriggerable(tokens.type)) {
          vscode.commands.executeCommand(this._triggerSuggestCommandId);
        }
      }
    }
  }
}
