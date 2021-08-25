import * as vscode from 'vscode';

import { IConfiguration } from '../../configuration';

import {
  TokenCompletionItem,
  IrregularCompletionItem,
  EmojiCompletionItem
} from './tokenCompletionItem';
import constants from './constants';

export const SCOPE_RANGE_REGEX = /\(\$?[\w\-\.]*[\(\) ]*/;
export const EMOJI_RANGE_REGEX = /:[-+_a-z0-9]*(((?<=[-+_a-z0-9]):)? *)/;

export class SummaryCompletionItemManager {
  public readonly typeItems: TokenCompletionItem[];
  public get scopeItems(): IrregularCompletionItem[] {
    return this._makeScopeItems();
  }
  public readonly emojiItems: EmojiCompletionItem[];

  private readonly _defaultScopeItems: IrregularCompletionItem[];

  private readonly _config: IConfiguration;

  constructor(createNewScopeCommandId: string, config: IConfiguration) {
    this.typeItems = constants.summaryTypes.map((e) => {
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

    this.emojiItems = constants.summaryEmojis.map((e, i) => {
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

    this._defaultScopeItems = this._createDefaultScopeItems(createNewScopeCommandId);

    this._config = config;
  }

  private _createDefaultScopeItems(createNewScopeCommandId: string): IrregularCompletionItem[] {
    const item = new IrregularCompletionItem('Create New Scope', vscode.CompletionItemKind.Event);
    item.documentation = new vscode.MarkdownString(
      'New scope created will be saved into `.vscode/settings.json`'
    );
    item.sortText = '999';
    item.filterText = '';
    item.insertText = '';
    item.command = { title: 'Create New Scope', command: createNewScopeCommandId };

    return [item];
  }

  private _makeScopeItems(): IrregularCompletionItem[] {
    const items = this._defaultScopeItems.slice(0);

    this._config.userScopes.forEach((e) => {
      const item = new IrregularCompletionItem(e.scope, vscode.CompletionItemKind.Text);
      if (e.description !== undefined) {
        item.documentation = new vscode.MarkdownString(e.description);
      }
      item.sortText = (items.length % 1000).toString().padStart(3, '0');
      item.filterText = '(' + e.scope;
      item.insertText = '(' + e.scope + ')';
      item.rangeRegex = SCOPE_RANGE_REGEX;

      items.push(item);
    });

    return items;
  }
}
