import * as vscode from 'vscode';

import { Configuration } from '../../configuration';

import * as vsceUtil from '@phoihos/vsce-util';
import {
  SummaryCompletionItemManager,
  SCOPE_RANGE_REGEX,
  EMOJI_RANGE_REGEX
} from './summaryCompletionItemManager';
import { TextDocumentParserProxy, ELineType, ETokenType } from './textDocumentParserProxy';
import { parseSummary } from './textDocumentParserProxy';

export class SummaryCompletionItemProvider
  extends vsceUtil.Disposable
  implements vscode.CompletionItemProvider
{
  private readonly _triggers = [':'];

  private readonly _itemManager: SummaryCompletionItemManager;
  private readonly _parserProxy: TextDocumentParserProxy;

  private readonly _config: Configuration;

  constructor(
    selector: string,
    itemManager: SummaryCompletionItemManager,
    parserProxy: TextDocumentParserProxy,
    config: Configuration
  ) {
    super();

    this._itemManager = itemManager;
    this._parserProxy = parserProxy;

    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.languages.registerCompletionItemProvider(selector, this, ...this._triggers)
    );
    this.register(subscriptions);
  }

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    if (this._config.completionEnabled === false) return [];

    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType === ELineType.Summary) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const tokens = parseSummary(leadingText);

      if (tokens.tokenTypeAt === ETokenType.None || tokens.tokenTypeAt === ETokenType.Type) {
        return this._itemManager.typeItems;
      } else if (tokens.tokenTypeAt === ETokenType.Scope) {
        return this._itemManager.getScopeItems(
          document.uri,
          document.getWordRangeAtPosition(position, SCOPE_RANGE_REGEX)
        );
      } else if (tokens.tokenTypeAt === ETokenType.Desc) {
        const emojiRange = document.getWordRangeAtPosition(position, EMOJI_RANGE_REGEX);
        if (emojiRange !== undefined) {
          const needsFilter = context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter;
          const filterToken = needsFilter ? (tokens.isBreaking ? '!' : tokens.type) : '*';

          return this._itemManager.getEmojiItems(emojiRange, filterToken);
        }
      }
    }

    return [];
  }

  public resolveCompletionItem(
    item: vscode.CompletionItem,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    return item;
  }
}
