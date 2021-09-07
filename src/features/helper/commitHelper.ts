import * as vscode from 'vscode';

import { IGitCommit } from '../../gitService/interface';

function _isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function makeCommitDescription(commit: IGitCommit, verbose: boolean = false): string {
  let desc = [commit.authorName, commit.commitTimeAgo].filter(_isNonEmptyString).join(', ');

  if (verbose) {
    desc += (desc.length > 0 ? '  ' : '') + `$(git-commit)  ${commit.hashShort}`;
  }

  return desc;
}

export function makeCommitMarkdown(
  commit: IGitCommit,
  options?: { includeDesc?: 'terse' | 'verbose' }
): vscode.MarkdownString {
  const markdown: vscode.MarkdownString = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = true;

  // description
  if (options?.includeDesc !== undefined) {
    markdown.appendMarkdown(makeCommitDescription(commit, options.includeDesc === 'verbose'));
    markdown.appendMarkdown('\n\n---\n\n');
  }

  // message
  markdown.appendMarkdown(commit.message.replace(/(\r?\n){1}/g, '  $1'));

  return markdown;
}
