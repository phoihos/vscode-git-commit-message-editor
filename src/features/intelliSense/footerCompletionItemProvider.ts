import * as vscode from 'vscode';

import { Configuration } from '../../configuration';
import { makeIssueMarkdown } from '../helper/issueHelper';

import * as vsceUtil from '@phoihos/vsce-util';
import { FooterCompletionItemManager, IssueCompletionItem } from './footerCompletionItemManager';
import { TextDocumentParserProxy, ELineType, ETokenType } from './textDocumentParserProxy';
import { parseFooter } from './textDocumentParserProxy';
import constants from './constants';

export class FooterCompletionItemProvider
  extends vsceUtil.Disposable
  implements vscode.CompletionItemProvider
{
  private readonly _itemManager: FooterCompletionItemManager;
  private readonly _parserProxy: TextDocumentParserProxy;

  private readonly _config: Configuration;

  constructor(
    selector: string,
    itemManager: FooterCompletionItemManager,
    parserProxy: TextDocumentParserProxy,
    config: Configuration
  ) {
    super();

    this._itemManager = itemManager;
    this._parserProxy = parserProxy;

    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(vscode.languages.registerCompletionItemProvider(selector, this));
    this.register(subscriptions);
  }

  public provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    if (this._config.completionEnabled === false) return [];

    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType & ELineType.Footer) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const tokens = parseFooter(leadingText);

      if (tokens.tokenTypeAt === ETokenType.None || tokens.tokenTypeAt === ETokenType.Type) {
        return this._itemManager.typeItems.map((e) => {
          e.range = document.getWordRangeAtPosition(position, e.rangeRegex);
          return e;
        });
      } else if (tokens.tokenTypeAt === ETokenType.Desc) {
        if (constants.isIssueTriggerable(tokens.type)) {
          const leadingChar = line.text.charAt(position.character - 1);
          if (leadingChar === '#') {
            return this._itemManager.getIssueItems(document.uri);
          }
        } else if (constants.isCommitTriggerable(tokens.type)) {
          return this._itemManager.getCommitItems(document.uri);
        }
      }
    }

    return [];
  }

  public resolveCompletionItem(
    item: vscode.CompletionItem,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    if (item instanceof IssueCompletionItem) {
      item.documentation = makeIssueMarkdown(item.issue);
    }
    return item;
  }
}
