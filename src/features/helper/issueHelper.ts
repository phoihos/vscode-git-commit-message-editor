/**
 * @description This is a modified version of the original code from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/issues/util.ts
 */

import * as vscode from 'vscode';

import { IGitIssue } from '../../gitService/interface';

import { minifyMarkdown } from './markdownHelper';

export const ISSUE_BODY_LENGTH = 280;

function _makeLabel(color: string, text: string): string {
  let textColor: string = 'ffffff';

  const matches = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (matches !== null) {
    const [r, g, b] = [
      parseInt(matches[1], 16),
      parseInt(matches[2], 16),
      parseInt(matches[3], 16)
    ];
    // Color algorithm from https://stackoverflow.com/questions/1855884/determine-font-color-based-on-background-color
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (luminance > 0.5) {
      textColor = '000000';
    }
  }

  return `<span style="color:#${textColor};background-color:#${color};">&nbsp;&nbsp;${text}&nbsp;&nbsp;</span>`;
}

function _getIssueIcon(state: string): string {
  switch (state) {
    case 'open':
      return '<span style="color:#22863a;">$(issues)</span>';
    case 'closed':
      return '<span style="color:#cb2431;">$(issue-closed)</span>';
    default:
      return '';
  }
}

function _getLocaleString(dateString: string): string {
  const date = new Date(dateString);

  return date.toLocaleString('default', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function _calcBodyLengthLimit(body: string): number {
  let offset = 0;

  const imageLinkRegex = /!\[.*\]\(.+\)/g;
  let match: RegExpExecArray | null;

  while ((match = imageLinkRegex.exec(body)) !== null) {
    if (match.index - offset >= ISSUE_BODY_LENGTH) {
      break;
    }
    offset += match[0].length - 1;
  }

  return ISSUE_BODY_LENGTH + offset;
}

export function makeIssueMarkdown(
  issue: IGitIssue,
  options?: { includeTitle?: boolean }
): vscode.MarkdownString {
  const markdown: vscode.MarkdownString = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = true;

  // title
  if (options?.includeTitle === true) {
    markdown.appendMarkdown(issue.title);
    markdown.appendMarkdown('\n\n---\n\n');
  }

  // labels
  if (issue.labels.length > 0) {
    const labels = issue.labels.map((e) => `[${_makeLabel(e.color, e.name)}](${e.url})`).join(' ');
    markdown.appendMarkdown(labels + '  \n');
  }

  // number
  markdown.appendMarkdown(`${_getIssueIcon(issue.state)} [#${issue.number}](${issue.url})`);
  // createdAt
  markdown.appendMarkdown(` • ${_getLocaleString(issue.createdAt)}`);
  // milestone
  if (issue.milestone !== undefined) {
    markdown.appendMarkdown(
      `&nbsp;&nbsp;$(milestone) [${issue.milestone.title}](${issue.milestone.url})`
    );
  }
  markdown.appendMarkdown('  \n');

  // repo
  const ownerRepo = `${issue.remote.owner}/${issue.remote.repo}`;
  markdown.appendMarkdown(`$(repo) [${ownerRepo}](https://${issue.remote.host}/${ownerRepo})`);

  // hr
  markdown.appendMarkdown('\n\n---\n\n');

  // body
  let body = minifyMarkdown(issue.body);
  const bodyLengthLimit = _calcBodyLengthLimit(body);
  body = body.length > bodyLengthLimit ? body.substr(0, bodyLengthLimit) + '...' : body;
  markdown.appendMarkdown(body);

  return markdown;
}
