import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { Commit as ICommit } from '../../gitService/git';
import { IConfiguration } from '../../configuration';
import { findSummaryLine } from '../parser/textDocumentParser';

export interface ICommitPickItem extends vscode.QuickPickItem {
  readonly commitMessage: string;
}

export interface IRecentCommits {
  readonly pickItems: ICommitPickItem[];
  readonly insertRange: vscode.Range;
}

class CommitPickItemBuilder {
  private static readonly _eolRegex = /\r?\n/;

  private readonly _epochs: { label: string; seconds: number; article?: string }[] = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600, article: 'an' },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  public build(commit: ICommit): ICommitPickItem {
    const lines = commit.message.split(CommitPickItemBuilder._eolRegex);

    return {
      label: lines[0] + (lines.length > 1 ? ` $(more)(+${lines.length - 1})` : ''),
      description:
        '$(git-commit) ' +
        commit.hash.substring(0, 7) + // short hash (7-digit)
        this._convertDateToTimeAgo(commit.commitDate),
      commitMessage: commit.message
    };
  }

  private _convertDateToTimeAgo(date?: Date): string {
    if (date === undefined) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const epoch = this._epochs.find((e) => Math.floor(seconds / e.seconds) >= 1);
    if (epoch === undefined) return '';

    const num = Math.floor(seconds / epoch.seconds);
    const time = num > 1 ? `${num} ${epoch.label}s` : `${epoch.article ?? 'a'} ${epoch.label}`;

    return ' • ' + time + ' ago';
  }
}

export class RecentCommitsResolver {
  private readonly _pickItemBuilder = new CommitPickItemBuilder();

  private readonly _git: IGitService;
  private readonly _config: IConfiguration;

  constructor(git: IGitService, config: IConfiguration) {
    this._git = git;
    this._config = config;
  }

  resolveRecentCommits(document: vscode.TextDocument): Promise<IRecentCommits | undefined> {
    const summaryLineNumber = findSummaryLine(document);
    if (summaryLineNumber < 0) return Promise.resolve(undefined);

    const summaryLine = document.lineAt(summaryLineNumber);
    if (summaryLine.isEmptyOrWhitespace === false) return Promise.resolve(undefined);

    const lowerPath = document.uri.path.toLowerCase();
    const repository = this._git.api?.repositories.find((e) =>
      lowerPath.includes(e.rootUri.path.toLowerCase())
    );
    if (repository === undefined) return Promise.resolve(undefined);

    return repository
      .log({ maxEntries: this._config.recentCommitsMaxItems })
      .catch((err): ICommit[] => {
        if (/your current branch '.+' does not have any commits yet/.test(err.stderr ?? '')) {
          return [];
        } else {
          throw err;
        }
      })
      .then((commits): IRecentCommits => {
        return {
          pickItems: commits.map((e) => this._pickItemBuilder.build(e)),
          insertRange: summaryLine.range
        };
      })
      .catch((err): undefined => {
        console.log(err);
        vscode.window.showErrorMessage(err.stderr ?? err.message);
        return undefined;
      });
  }
}
