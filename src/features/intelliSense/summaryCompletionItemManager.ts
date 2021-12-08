import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IGitCommit } from '../../gitService/interface';
import { IConfiguration, ISummaryScope } from '../../configuration';

import { SUMMARY_SYNTAX_REGEX, SUMMARY_TOKEN_SCOPE_REGEX, EOL_REGEX } from '../parser/syntaxRegex';

import { TokenCompletionItem, EmojiCompletionItem } from './tokenCompletionItem';
import constants from './constants';

export const SCOPE_RANGE_REGEX = /\(\$?[\w\-\.]*[\(\) ]*/;
export const EMOJI_RANGE_REGEX = /:[-+_a-z0-9]*(((?<=[-+_a-z0-9]):)? *)/;

export class SummaryCompletionItemManager {
  public readonly typeItems: TokenCompletionItem[];

  private readonly _emojiItems: EmojiCompletionItem[];
  private readonly _defaultScopeItems: TokenCompletionItem[];

  private readonly _git: IGitService;
  private readonly _config: IConfiguration;

  constructor(createNewScopeCommandId: string, git: IGitService, config: IConfiguration) {
    //#region Type completion items
    this.typeItems = constants.summaryTypes.map((e) => {
      const item = new TokenCompletionItem(e.type);
      item.detail = e.title;
      item.documentation = new vscode.MarkdownString(e.emojis[0] + ' ' + e.description);
      item.sortText = e.sort.toString().padStart(2, '0');
      return item;
    });
    //#endregion

    //#region Emoji completion items
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

    this._emojiItems = constants.summaryEmojis.map((e, i) => {
      const filter = getEmojiFilter(e.emoji);

      const item = new EmojiCompletionItem(e.code, filter.token);
      item.detail = e.emoji;
      item.sortText = filter.sortText + i.toString().padStart(emojiIndexPadding, '0');
      item.insertText = e.emoji + ' ';
      item.filterDoc = new vscode.MarkdownString(
        e.description + `\n\n$(pinned)Suggested by *${filter.token}*`,
        true
      );
      item.nonFilterDoc = new vscode.MarkdownString(e.description);
      return item;
    });
    //#endregion

    this._defaultScopeItems = this._createDefaultScopeItems(createNewScopeCommandId);

    this._git = git;
    this._config = config;
  }

  public getScopeItems(
    uri: vscode.Uri,
    scopeRange: vscode.Range | undefined
  ): Thenable<TokenCompletionItem[]> {
    const logScopesLoading = this._config.logScopesEnabled
      ? this._git
          .getCommits(uri, this._config.recentCommitsMaxItems)
          .then((commits): ISummaryScope[] => {
            return this._grepLogScopes(commits);
          })
      : Promise.resolve<ISummaryScope[]>([]);

    return logScopesLoading.then((logScopes): TokenCompletionItem[] => {
      return this._makeScopeItems(logScopes, scopeRange);
    });
  }

  public getEmojiItems(emojiRange: vscode.Range, filterToken: string): EmojiCompletionItem[] {
    const fallbackItems: EmojiCompletionItem[] = [];

    const items = this._emojiItems.filter((e) => {
      e.range = emojiRange;
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

  private _createDefaultScopeItems(createNewScopeCommandId: string): TokenCompletionItem[] {
    const item = new TokenCompletionItem('Create New Scope', vscode.CompletionItemKind.Event);
    item.documentation = new vscode.MarkdownString(
      'New scope created will be saved into `.vscode/settings.json`'
    );
    item.sortText = '999';
    item.filterText = '';
    item.insertText = '';
    item.command = { title: 'Create New Scope', command: createNewScopeCommandId };

    return [item];
  }

  private _grepLogScopes(commits: IGitCommit[]): ISummaryScope[] {
    const logScopes: ISummaryScope[] = [];

    commits.forEach((e) => {
      const lines = e.message.split(EOL_REGEX);
      const match = lines[0].match(SUMMARY_SYNTAX_REGEX);
      const scope = match?.[3] ?? ''; // (\$?[\w\-\.]*)

      if (SUMMARY_TOKEN_SCOPE_REGEX.test(scope)) {
        const isExist = logScopes.some((ee) => ee.scope === scope);
        if (isExist === false) {
          let description = lines[0].replace(`(${scope})`, `(**${scope}**)`);
          description += lines.length > 1 ? ` $(more)(+${lines.length - 1})` : '';
          description += `\n\n$(pinned)Suggested from$(git-commit)*${e.hashShort}*`;
          logScopes.push({ scope, description });
        }
      }
    });

    return logScopes;
  }

  private _makeScopeItems(
    logScopes: ISummaryScope[],
    scopeRange: vscode.Range | undefined
  ): TokenCompletionItem[] {
    const items = this._defaultScopeItems.slice(0);

    const scopes = logScopes.reduce(
      (acc, e) => {
        if (acc.some((ee) => ee.scope === e.scope) === false) {
          acc.push(e);
        }
        return acc;
      },
      [...this._config.userScopes]
    );

    scopes.forEach((e) => {
      const item = new TokenCompletionItem(e.scope, vscode.CompletionItemKind.Text);
      if (e.description !== undefined) {
        item.documentation = new vscode.MarkdownString(e.description, true);
      }
      item.sortText = (items.length % 1000).toString().padStart(3, '0');
      item.filterText = '(' + e.scope;
      item.insertText = '(' + e.scope + ')';
      item.range = scopeRange;

      items.push(item);
    });

    return items;
  }
}
