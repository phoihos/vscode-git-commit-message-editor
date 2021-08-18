import * as vscode from 'vscode';

import { ETokenType, parseFooter } from './textLineParser';

export enum ELineType {
  None = 0x00,
  Summary = 0x01,
  Body = 0x02,
  Footer = 0x04
}

// see: https://github.com/conventional-commits/parser#the-grammar
const _footerBcTokenRegexes = [/^(BREAKING CHANGE|\!)(: )(.*)$/i, /^([\w\-]+)(: | #)(.*)$/];

export function getLineType(
  document: vscode.TextDocument,
  line: number,
  cc: string = '#'
): ELineType {
  const summaryLine = findSummaryLine(document, cc);
  if (summaryLine < 0 || summaryLine > line) return ELineType.None;
  if (summaryLine === line) return ELineType.Summary;

  const [bodyLines, footerLines] = findBodyFooterLines(document, summaryLine, cc);

  let lineType = ELineType.None;
  if (bodyLines.includes(line)) {
    lineType = lineType | ELineType.Body;
  }
  if (footerLines.includes(line)) {
    lineType = lineType | ELineType.Footer;
  }

  return lineType;
}

export function findSummaryLine(document: vscode.TextDocument, cc: string = '#'): number {
  let firstEmptyLine = -1;

  for (let i = 0; i < document.lineCount; ++i) {
    const line = document.lineAt(i);

    // skip commentary
    if (line.text.charAt(0) === cc) {
      continue;
    }

    if (line.isEmptyOrWhitespace) {
      if (firstEmptyLine < 0) {
        firstEmptyLine = i;
      }
      continue;
    }

    return i;
  }

  return firstEmptyLine;
}

export function findBodyFooterLines(
  document: vscode.TextDocument,
  summaryLine: number,
  cc: string = '#'
): [number[], number[]] {
  if (document.lineAt(summaryLine).isEmptyOrWhitespace) return [[], []];

  const blankLine = summaryLine + 1;
  if (blankLine >= document.lineCount) return [[], []];
  if (document.lineAt(blankLine).isEmptyOrWhitespace === false) return [[], []];

  const bodyLines: number[] = [];
  let prevLineText = '';
  let matchedFooterLineStart: number | undefined = undefined;
  let greedyFooterLineStart: number | undefined = undefined;
  let emptyFooterLineStart: number | undefined = undefined;

  for (let i = blankLine + 1; i < document.lineCount; ++i) {
    const line = document.lineAt(i);

    // skip commentary
    if (line.text.charAt(0) === cc) {
      continue;
    }

    if (matchedFooterLineStart === undefined) {
      if (prevLineText.length === 0) {
        if (line.isEmptyOrWhitespace) {
          emptyFooterLineStart = emptyFooterLineStart ?? bodyLines.length;
        } else {
          if (_footerBcTokenRegexes.some((regex) => regex.test(line.text))) {
            matchedFooterLineStart = bodyLines.length;
          } else {
            greedyFooterLineStart = greedyFooterLineStart ?? bodyLines.length;
          }
        }
      } else {
        if (parseFooter(prevLineText).tokenTypeAt !== ETokenType.Type) {
          greedyFooterLineStart = undefined;
        }
        emptyFooterLineStart = undefined;
      }
    }

    bodyLines.push(i);
    prevLineText = line.isEmptyOrWhitespace ? '' : line.text;
  }

  const footerLineStart = matchedFooterLineStart ?? greedyFooterLineStart ?? emptyFooterLineStart;
  if (footerLineStart === undefined) return [bodyLines, []];

  const hasGreedyFooterLines = footerLineStart === greedyFooterLineStart;
  const bodyLineEnd = hasGreedyFooterLines ? undefined : Math.max(footerLineStart - 1, 0);

  return [bodyLines.slice(0, bodyLineEnd), bodyLines.slice(footerLineStart)];
}
