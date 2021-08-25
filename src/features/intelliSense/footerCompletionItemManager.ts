import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IGitIssue } from '../../gitService/interface';
import { IConfiguration } from '../../configuration';

import { TokenCompletionItem, IrregularCompletionItem } from './tokenCompletionItem';
import constants from './constants';

export class IssueCompletionItem extends TokenCompletionItem {
  public readonly issue: IGitIssue;

  constructor(issue: IGitIssue) {
    super(issue.number.toString(), vscode.CompletionItemKind.Issue);

    this.issue = issue;
  }
}

export class FooterCompletionItemManager {
  public readonly typeItems: IrregularCompletionItem[];

  private readonly _triggerSuggestCommandId: string;

  private readonly _noIssuesItem: TokenCompletionItem;
  private readonly _noCommitsItem: TokenCompletionItem;
  private readonly _issuePaginationMap = new Map<string, number>();

  private readonly _git: IGitService;
  private readonly _config: IConfiguration;

  constructor(triggerSuggestCommandId: string, git: IGitService, config: IConfiguration) {
    this.typeItems = constants.footerTypes.map((e) => {
      const item = new IrregularCompletionItem(e.type);
      item.detail = e.title;
      item.documentation = new vscode.MarkdownString(e.emojis[0] + ' ' + e.description);
      item.sortText = e.sort.toString().padStart(2, '0');
      item.insertText = e.type + e.separator;
      item.rangeRegex = new RegExp(e.regex ?? `[\\w\\-]+[${e.separator}]*`);
      if (e.descType !== undefined) {
        item.command = { title: e.descType, command: triggerSuggestCommandId };
      }
      return item;
    });

    this._triggerSuggestCommandId = triggerSuggestCommandId;

    this._noIssuesItem = this._createNoIssuesItem();
    this._noCommitsItem = this._createNoCommitsItem();

    this._git = git;
    this._config = config;
  }

  public isIssueTriggerable(type: string): boolean {
    const item = this.typeItems.find((e) => e.label === type);

    return item?.command?.title === 'issue';
  }

  public isCommitTriggerable(type: string): boolean {
    const item = this.typeItems.find((e) => e.label === type);

    return item?.command?.title === 'commit';
  }

  public getIssueItems(uri: vscode.Uri): Thenable<TokenCompletionItem[]> {
    const key = uri.path;

    const per_page = this._config.issuesPageSize;
    const page = this._issuePaginationMap.get(key) ?? 1;
    this._issuePaginationMap.delete(key);

    return this._git.getIssues(uri, { per_page, page }).then((issues) => {
      const orderPadding = (issues.length - 1).toString().length;

      const items = issues
        .slice(0, per_page)
        .filter((e) => e.isPR === false)
        .map((e, i) => {
          const labels = e.labels.map((e) => e.name).join(' ');

          const item: TokenCompletionItem = new IssueCompletionItem(e);
          item.detail = e.title;
          item.documentation = e.body;
          item.sortText = i.toString().padStart(orderPadding, '0');
          item.filterText = `${e.number} ${e.title} ${labels} ${e.milestone?.title}`;
          return item;
        });

      if (items.length === 0) {
        items.push(this._noIssuesItem);
      } else {
        if (issues.length > per_page) {
          const issue = issues[0];
          const ownerRepo = `${issue.remote.owner}/${issue.remote.repo}`;

          const item = new TokenCompletionItem('Next Page', vscode.CompletionItemKind.Event);
          item.detail = 'Load more issues from next page';
          item.documentation = new vscode.MarkdownString(
            `$(repo) [${ownerRepo}](https://${issue.remote.host}/${ownerRepo})`,
            true
          );
          item.sortText = items.length.toString().padStart(orderPadding, '0');
          item.filterText = '';
          item.insertText = '';
          item.command = {
            title: 'Trigger Next Page',
            command: this._triggerSuggestCommandId,
            arguments: [
              () => {
                this._issuePaginationMap.set(key, page + 1);
              }
            ]
          };

          items.push(item);
        }
      }

      return items;
    });
  }

  public getCommitItems(uri: vscode.Uri): Thenable<TokenCompletionItem[]> {
    return this._git.getCommits(uri).then((commits) => {
      const orderPadding = (commits.length - 1).toString().length;

      const items = commits.map((e, i) => {
        const detail = [e.authorName, e.commitTimeAgo]
          .filter((ee) => ee !== undefined && ee.length > 0)
          .join(', ');

        const item = new vscode.CompletionItem(e.hashShort, vscode.CompletionItemKind.Constant);
        item.detail = detail;
        item.documentation = new vscode.MarkdownString(e.message);
        item.sortText = i.toString().padStart(orderPadding, '0');
        return item;
      });

      if (items.length === 0) {
        items.push(this._noCommitsItem);
      }

      return items;
    });
  }

  private _createNoIssuesItem(): TokenCompletionItem {
    const item = new TokenCompletionItem('No Issues', vscode.CompletionItemKind.Issue);
    item.documentation = new vscode.MarkdownString('No issues could be found');
    item.filterText = '';
    item.insertText = '';

    return item;
  }

  private _createNoCommitsItem(): TokenCompletionItem {
    const item = new TokenCompletionItem('No Commits', vscode.CompletionItemKind.Constant);
    item.documentation = new vscode.MarkdownString('No commits could be found');
    item.filterText = '';
    item.insertText = '';

    return item;
  }
}
