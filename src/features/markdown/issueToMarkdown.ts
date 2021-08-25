/**
 * @description This is a modified version of the original code from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/issues/util.ts
 */

import * as vscode from 'vscode';
import * as marked from 'marked';

import { IGitIssue } from '../../gitService/interface';

import { unescape as unescapeReplacer } from './htmlHelper';

export const ISSUE_BODY_LENGTH = 280;

export class PlainTextRenderer extends marked.Renderer {
  public code(code: string, language: string | undefined, _isEscaped: boolean): string {
    return `\`${
      language === 'markdown' || language === 'md'
        ? marked.parse(code, { renderer: new PlainTextRenderer() })
        : code
    }\` `;
  }
  public blockquote(quote: string): string {
    return quote;
  }
  public html(_html: string): string {
    return '';
  }
  public heading(
    text: string,
    _level: 1 | 2 | 3 | 4 | 5 | 6,
    _raw: string,
    _slugger: marked.Slugger
  ): string {
    return text + ' ';
  }
  public hr(): string {
    return '';
  }
  public list(body: string, ordered: boolean, start: number): string {
    return body.replace(/\${li}/g, ordered ? () => `${start++}\\.` : () => '\\-');
  }
  public listitem(text: string): string {
    return '${li} ' + text + ' ';
  }
  public checkbox(_checked: boolean): string {
    return '';
  }
  public paragraph(text: string): string {
    return text.replace(/(<|>)/g, '\\$1') + ' ';
  }
  public table(header: string, body: string): string {
    return header + ' ' + body;
  }
  public tablerow(content: string): string {
    return content;
  }
  public tablecell(
    content: string,
    _flags: {
      header: boolean;
      align: 'center' | 'left' | 'right' | null;
    }
  ): string {
    return content;
  }
  public strong(text: string): string {
    return text;
  }
  public em(text: string): string {
    return text;
  }
  public codespan(code: string): string {
    return '`' + code + '`';
  }
  public br(): string {
    return ' ';
  }
  public del(text: string): string {
    return text;
  }
  public link(_href: string, _title: string, text: string): string {
    return text + ' ';
  }
  public image(_href: string, _title: string, _text: string): string {
    return '';
  }
  public text(text: string): string {
    return text;
  }
}

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

function _getLocaleString(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString('default', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function issueToMarkdown(issue: IGitIssue): vscode.MarkdownString {
  const markdown: vscode.MarkdownString = new vscode.MarkdownString(undefined, true);
  markdown.isTrusted = true;

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
  let body = marked.parse(issue.body, { renderer: new PlainTextRenderer() });
  body = body.replace(/`.+`/g, unescapeReplacer); // unescape html entities inside of code blocks
  body = body.length > ISSUE_BODY_LENGTH ? body.substr(0, ISSUE_BODY_LENGTH) + '...' : body;
  markdown.appendMarkdown(body);

  return markdown;
}
