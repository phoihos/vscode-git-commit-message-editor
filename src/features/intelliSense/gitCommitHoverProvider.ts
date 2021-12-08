import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IConfiguration } from '../../configuration';

import { makeIssueMarkdown } from '../helper/issueHelper';
import { makeCommitMarkdown } from '../helper/commitHelper';

import * as vsceUtil from '@phoihos/vsce-util';
import { TextDocumentParserProxy, ELineType, ETokenType } from './textDocumentParserProxy';
import { parseSummary, parseFooter } from './textDocumentParserProxy';
import constants from './constants';

class SummaryHoverProvider {
  private readonly _config: IConfiguration;

  constructor(config: IConfiguration) {
    this._config = config;
  }

  public provideHover(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(range.end.line);
    const leadingText = line.text.substring(0, range.end.character);
    const tokens = parseSummary(leadingText);

    if (tokens.tokenTypeAt === ETokenType.Type) {
      const type = constants.summaryTypes.find((e) => e.type === tokens.type);

      if (type !== undefined) {
        return new vscode.Hover(
          [
            new vscode.MarkdownString(type.title),
            new vscode.MarkdownString(type.emojis[0] + ' ' + type.description)
          ],
          range
        );
      }
    } else if (tokens.tokenTypeAt === ETokenType.Scope) {
      const scope = this._config.userScopes.find((e) => e.scope === tokens.scope);

      if (scope !== undefined) {
        const leadingChar = line.text.charAt(range.start.character - 1);
        if (leadingChar === '$') {
          range = range.with(range.start.translate(0, -1));
        }

        return new vscode.Hover(new vscode.MarkdownString(scope.description), range);
      }
    } else if (tokens.tokenTypeAt === ETokenType.Desc) {
      const rangeText = document.getText(range);
      const emoji = constants.summaryEmojis.find((e) => e.emoji === rangeText);

      if (emoji !== undefined) {
        return new vscode.Hover(
          [new vscode.MarkdownString(emoji.code), new vscode.MarkdownString(emoji.description)],
          range
        );
      }
    }
  }
}

class FooterHoverProvider {
  private readonly _git: IGitService;

  constructor(git: IGitService) {
    this._git = git;
  }

  public provideHover(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<vscode.Hover> {
    const line = document.lineAt(range.end.line);
    const leadingText = line.text.substring(0, range.end.character);
    const tokens = parseFooter(leadingText);

    if (tokens.tokenTypeAt === ETokenType.Type) {
      const type = constants.footerTypes.find((e) => e.type === tokens.type);

      if (type !== undefined) {
        return new vscode.Hover(
          [
            new vscode.MarkdownString(type.title),
            new vscode.MarkdownString(type.emojis[0] + ' ' + type.description)
          ],
          range
        );
      }
    } else if (tokens.tokenTypeAt === ETokenType.Desc) {
      if (constants.isIssueTriggerable(tokens.type)) {
        const leadingChar = line.text.charAt(range.start.character - 1);
        if (leadingChar === '#') {
          const issueNumber = parseInt(document.getText(range));
          range = range.with(range.start.translate(0, -1));

          return this._git
            .getIssue(document.uri, issueNumber)
            .then((issue): vscode.Hover | undefined => {
              if (issue !== undefined) {
                return new vscode.Hover(makeIssueMarkdown(issue, { includeTitle: true }), range);
              }
            });
        }
      } else if (constants.isCommitTriggerable(tokens.type)) {
        const commitHash = document.getText(range);

        return this._git
          .getCommit(document.uri, commitHash)
          .then((commit): vscode.Hover | undefined => {
            if (commit !== undefined) {
              return new vscode.Hover(makeCommitMarkdown(commit, { includeDesc: 'terse' }), range);
            }
          });
      }
    }
  }
}

export class GitCommitHoverProvider extends vsceUtil.Disposable implements vscode.HoverProvider {
  private readonly _summaryHoverProvider: SummaryHoverProvider;
  private readonly _footerHoverProvider: FooterHoverProvider;

  private readonly _parserProxy: TextDocumentParserProxy;

  private readonly _config: IConfiguration;

  constructor(
    selector: string,
    parserProxy: TextDocumentParserProxy,
    git: IGitService,
    config: IConfiguration
  ) {
    super();

    this._summaryHoverProvider = new SummaryHoverProvider(config);
    this._footerHoverProvider = new FooterHoverProvider(git);

    this._parserProxy = parserProxy;

    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(vscode.languages.registerHoverProvider(selector, this));
    this.register(subscriptions);
  }

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    if (this._config.hoverEnabled === false) return;

    const range = document.getWordRangeAtPosition(position);
    if (range === undefined) return;

    const lineType = this._parserProxy.getLineType(document, position.line);

    if (lineType === ELineType.Summary) {
      return this._summaryHoverProvider.provideHover(document, range);
    } else if (lineType & ELineType.Footer) {
      return this._footerHoverProvider.provideHover(document, range);
    }
  }
}
