import * as vscode from 'vscode';

import { ELineType, findSummaryLine, findBodyFooterLines } from '../parser/textDocumentParser';

export { ELineType };
export { ETokenType, parseSummary, parseFooter } from '../parser/textLineParser';

type MessageFrame = {
  summaryLine: number;
  bodyLines: number[];
  footerLines: number[];
};

export class TextDocumentParserProxy {
  private readonly _lineTypeCache = new Map<string, ELineType>();
  private readonly _messageFrameCache = new Map<string, MessageFrame>();

  public getLineType(document: vscode.TextDocument, line: number): ELineType {
    const key = document.uri.path + `#L${line}`;

    let value = this._lineTypeCache.get(key);
    if (value === undefined) {
      value = this._evalLineType(this._getMessageFrame(document), line);
      this._lineTypeCache.set(key, value);
    }

    return value;
  }

  public clearCache(document: vscode.TextDocument) {
    const key = document.uri.path;

    for (const superKey of this._lineTypeCache.keys()) {
      if (superKey.includes(key)) {
        this._lineTypeCache.delete(superKey);
      }
    }

    this._messageFrameCache.delete(key);
  }

  private _evalLineType(messageFrame: MessageFrame, line: number): ELineType {
    if (messageFrame.summaryLine < 0 || messageFrame.summaryLine > line) return ELineType.None;
    if (messageFrame.summaryLine === line) return ELineType.Summary;

    let lineType = ELineType.None;
    if (messageFrame.bodyLines.includes(line)) {
      lineType = lineType | ELineType.Body;
    }
    if (messageFrame.footerLines.includes(line)) {
      lineType = lineType | ELineType.Footer;
    }

    return lineType;
  }

  private _getMessageFrame(document: vscode.TextDocument): MessageFrame {
    const key = document.uri.path;

    let value = this._messageFrameCache.get(key);
    if (value === undefined) {
      value = this._parseDocument(document);
      this._messageFrameCache.set(key, value);
    }

    return value;
  }

  private _parseDocument(document: vscode.TextDocument): MessageFrame {
    const summaryLine = findSummaryLine(document);
    if (summaryLine < 0) return { summaryLine, bodyLines: [], footerLines: [] };

    const [bodyLines, footerLines] = findBodyFooterLines(document, summaryLine);

    return { summaryLine, bodyLines, footerLines };
  }
}
