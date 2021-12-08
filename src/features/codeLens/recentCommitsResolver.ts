import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IGitCommit } from '../../gitService/interface';
import { IConfiguration } from '../../configuration';

import { findSummaryLine } from '../parser/textDocumentParser';
import { EOL_REGEX } from '../parser/syntaxRegex';
import { makeCommitDescription } from '../helper/commitHelper';

export interface ICommitPickItem extends vscode.QuickPickItem {
  readonly commitMessage: string;
}

export interface IRecentCommits {
  readonly pickItems: ICommitPickItem[];
  readonly insertRange: vscode.Range;
}

export class RecentCommitsResolver {
  private readonly _git: IGitService;
  private readonly _config: IConfiguration;

  constructor(git: IGitService, config: IConfiguration) {
    this._git = git;
    this._config = config;
  }

  public resolveRecentCommits(document: vscode.TextDocument): Thenable<IRecentCommits | undefined> {
    const summaryLineNumber = findSummaryLine(document);
    if (summaryLineNumber < 0) return Promise.resolve(undefined);

    const summaryLine = document.lineAt(summaryLineNumber);
    if (summaryLine.isEmptyOrWhitespace === false) return Promise.resolve(undefined);

    return this._git
      .getCommits(document.uri, this._config.recentCommitsMaxItems)
      .then((commits): IRecentCommits => {
        return {
          pickItems: commits.map((e) => this._makePickItem(e)),
          insertRange: summaryLine.range
        };
      })
      .catch((err): undefined => {
        console.log(err);
        vscode.window.showErrorMessage(err.stderr ?? err.message);
        return undefined;
      });
  }

  private _makePickItem(commit: IGitCommit): ICommitPickItem {
    const lines = commit.message.split(EOL_REGEX);

    return {
      label: lines[0] + (lines.length > 1 ? ` $(more)(+${lines.length - 1})` : ''),
      description: makeCommitDescription(commit, true),
      commitMessage: commit.message
    };
  }
}
