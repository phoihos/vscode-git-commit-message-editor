import * as vscode from 'vscode';

import { IConfiguration } from '../../configuration';
import { ELineType, getLineType } from '../parser/textDocumentParser';
import { ETokenType, parseSummary, parseFooter } from '../parser/textLineParser';

import * as vsceUtil from '@phoihos/vsce-util';
import { CreateNewScopeCommand } from './createNewScopeCommand';
import { TokenCompletionItemManager } from './tokenCompletionItemManager';

export class GitCommitCompletionItemProvider
  extends vsceUtil.Disposable
  implements vscode.CompletionItemProvider
{
  private readonly _selector = 'git-commit';
  private readonly _triggers = ['(', ':'];

  private readonly _itemManager: TokenCompletionItemManager;

  private readonly _config: IConfiguration;

  constructor(config: IConfiguration) {
    super();

    const command = new CreateNewScopeCommand(TokenCompletionItemManager.scopeRangeRegex, config);
    this._itemManager = new TokenCompletionItemManager(command.id, config);

    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.commands.registerCommand(command.id, command.execute, command),
      vscode.languages.registerCompletionItemProvider(this._selector, this, ...this._triggers)
    );
    this.register(subscriptions);
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    if (this._config.completionEnabled === false) return [];

    const lineType = getLineType(document, position.line);

    if (lineType === ELineType.Summary) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const tokens = parseSummary(leadingText);

      if (tokens.tokenTypeAt === ETokenType.None || tokens.tokenTypeAt === ETokenType.Type) {
        return this._itemManager.summaryTypeItems;
      } else if (tokens.tokenTypeAt === ETokenType.Scope) {
        return this._itemManager.summaryScopeItems.map((e) => {
          e.range = document.getWordRangeAtPosition(position, e.rangeRegex);
          return e;
        });
      } else if (tokens.tokenTypeAt === ETokenType.Desc) {
        const leadingChar = line.text.charAt(position.character - 1);

        if (leadingChar === ':') {
          const range = document.getWordRangeAtPosition(
            position,
            TokenCompletionItemManager.emojiRangeRegex
          );
          const filterToken = tokens.isBreaking ? '!' : tokens.type;

          const fallbackItems: vscode.CompletionItem[] = [];
          const items = this._itemManager.summaryEmojiItems.filter((e) => {
            e.range = range;
            if (e.filterToken === filterToken) {
              e.documentation = e.filterDoc;
              return true;
            }
            e.documentation = e.nonFilterDoc;
            fallbackItems.push(e);
            return false;
          });

          return items.length > 0 ? items : fallbackItems;
        }
      }
    } else if (lineType & ELineType.Footer) {
      const line = document.lineAt(position.line);
      const leadingText = line.text.substring(0, position.character);
      const tokens = parseFooter(leadingText);

      if (tokens.tokenTypeAt === ETokenType.None || tokens.tokenTypeAt === ETokenType.Type) {
        return this._itemManager.footerTypeItems.map((e) => {
          e.range = document.getWordRangeAtPosition(position, e.rangeRegex);
          return e;
        });
      }
    }

    return [];
  }

  resolveCompletionItem(
    item: vscode.CompletionItem,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CompletionItem> {
    return item;
  }
}
