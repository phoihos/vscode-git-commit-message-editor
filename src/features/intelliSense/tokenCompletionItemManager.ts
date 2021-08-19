import * as vscode from 'vscode';

import { IConfiguration } from '../../configuration';

import constants from './constants';

export class TokenCompletionItem extends vscode.CompletionItem {
  constructor(label: string, kind?: vscode.CompletionItemKind) {
    super(label, kind ?? vscode.CompletionItemKind.Keyword);
  }
}

export class IrregularCompletionItem extends TokenCompletionItem {
  rangeRegex?: RegExp;
}

export class EmojiCompletionItem extends TokenCompletionItem {
  filterToken: string;
  filterDoc?: vscode.MarkdownString;
  nonFilterDoc?: vscode.MarkdownString;

  constructor(label: string, filterToken: string) {
    super(label, vscode.CompletionItemKind.Color);

    this.filterToken = filterToken;
  }
}

export class TokenCompletionItemManager {
  public static readonly scopeRangeRegex = /\(\$?[\w\-\.]*[\(\) ]*/;
  public static readonly emojiRangeRegex = /:[-+_a-z0-9]*(:? *)/;

  public readonly summaryTypeItems: TokenCompletionItem[];
  public get summaryScopeItems(): IrregularCompletionItem[] {
    return this._buildSummaryScopeItems();
  }
  public readonly summaryEmojiItems: EmojiCompletionItem[];
  public readonly footerTypeItems: IrregularCompletionItem[];

  private readonly _defaultSummaryScopeItems: IrregularCompletionItem[];

  private readonly _config: IConfiguration;

  constructor(createNewScopeCommandId: string, config: IConfiguration) {
    this.summaryTypeItems = constants.summaryTypes.map((e) => {
      const item = new TokenCompletionItem(e.type);
      item.detail = e.title;
      item.documentation = new vscode.MarkdownString(e.emojis[0] + ' ' + e.description);
      item.sortText = e.sort.toString().padStart(2, '0');
      return item;
    });

    const getEmojiFilter = (emoji: string): { token: string; sortText: string } => {
      // reserved emoji for BREAKING CHANGE
      if (emoji === '💥') return { token: '!', sortText: '1000' };

      for (const e of constants.summaryTypes) {
        const index = e.emojis.findIndex((ee) => ee === emoji);
        if (index !== -1) {
          return {
            token: e.type,
            sortText: e.sort.toString().padStart(3, '0') + (index % 10).toString()
          };
        }
      }

      return { token: '', sortText: '1000' };
    };
    const emojiIndexPadding = (constants.summaryEmojis.length - 1).toString().length;

    this.summaryEmojiItems = constants.summaryEmojis.map((e, i) => {
      const filter = getEmojiFilter(e.emoji);

      const item = new EmojiCompletionItem(e.code, filter.token);
      item.detail = e.emoji;
      item.sortText = filter.sortText + i.toString().padStart(emojiIndexPadding, '0');
      item.insertText = e.emoji + ' ';
      item.filterDoc = new vscode.MarkdownString(
        e.description + `  \n$(pinned)Suggested by **${filter.token}**`,
        true
      );
      item.nonFilterDoc = new vscode.MarkdownString(e.description);
      return item;
    });

    this.footerTypeItems = constants.footerTypes.map((e) => {
      const item = new IrregularCompletionItem(e.type);
      item.detail = e.title;
      item.documentation = new vscode.MarkdownString(e.emojis[0] + ' ' + e.description);
      item.sortText = e.sort.toString().padStart(2, '0');
      item.insertText = e.type + e.separator;
      item.rangeRegex = new RegExp(e.regex ?? `[\\w\\-]+[${e.separator}]*`);
      return item;
    });

    this._defaultSummaryScopeItems = this._createDefaultSummaryScopes(createNewScopeCommandId);

    this._config = config;
  }

  private _createDefaultSummaryScopes(createNewScopeCommandId: string): IrregularCompletionItem[] {
    const item = new IrregularCompletionItem('Create New Scope', vscode.CompletionItemKind.Snippet);
    item.documentation = new vscode.MarkdownString(
      'New scope created will be saved into `.vscode/settings.json`'
    );
    item.sortText = '999';
    item.filterText = '';
    item.insertText = '';
    item.command = { title: 'Create New Scope', command: createNewScopeCommandId };

    return [item];
  }

  private _buildSummaryScopeItems(): IrregularCompletionItem[] {
    const items = this._defaultSummaryScopeItems.slice(0);

    this._config.userScopes.forEach((e) => {
      const item = new IrregularCompletionItem(e.scope, vscode.CompletionItemKind.Text);
      if (e.description !== undefined) {
        item.documentation = new vscode.MarkdownString(e.description);
      }
      item.sortText = (items.length % 1000).toString().padStart(3, '0');
      item.filterText = '(' + e.scope;
      item.insertText = '(' + e.scope + ')';
      item.rangeRegex = TokenCompletionItemManager.scopeRangeRegex;

      items.push(item);
    });

    return items;
  }
}
