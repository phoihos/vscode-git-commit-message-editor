import * as vscode from 'vscode';

import { GitService } from '../../gitService';
import { GitCommit } from '../../gitService/interface';
import { Configuration } from '../../configuration';

import { findSummaryLine } from '../parser/textDocumentParser';
import { EOL_REGEX } from '../parser/syntaxRegex';
import { makeCommitDescription } from '../helper/commitHelper';

export interface CommitPickItem extends vscode.QuickPickItem {
  readonly commitMessage: string;
}

export interface RecentCommits {
  readonly pickItems: CommitPickItem[];
  readonly insertRange: vscode.Range;
}

export class RecentCommitsResolver {
  private readonly _git: GitService;
  private readonly _config: Configuration;

  constructor(git: GitService, config: Configuration) {
    this._git = git;
    this._config = config;
  }

  public resolveRecentCommits(document: vscode.TextDocument): Thenable<RecentCommits | undefined> {
    const summaryLineNumber = findSummaryLine(document);
    if (summaryLineNumber < 0) return Promise.resolve(undefined);

    const summaryLine = document.lineAt(summaryLineNumber);
    if (summaryLine.isEmptyOrWhitespace === false) return Promise.resolve(undefined);

    return this._git
      .getCommits(document.uri, this._config.recentCommitsMaxItems)
      .then((commits): RecentCommits => {
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

  private _makePickItem(commit: GitCommit): CommitPickItem {
    const lines = commit.message.split(EOL_REGEX);

    return {
      label: lines[0] + (lines.length > 1 ? ` $(more)(+${lines.length - 1})` : ''),
      description: makeCommitDescription(commit, true),
      commitMessage: commit.message
    };
  }
}
