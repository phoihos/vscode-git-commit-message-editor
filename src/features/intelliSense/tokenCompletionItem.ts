import * as vscode from 'vscode';

export class TokenCompletionItem extends vscode.CompletionItem {
  constructor(label: string, kind?: vscode.CompletionItemKind) {
    super(label, kind ?? vscode.CompletionItemKind.Keyword);
  }
}

export class IrregularCompletionItem extends TokenCompletionItem {
  rangeRegex?: RegExp;
}

export class EmojiCompletionItem extends TokenCompletionItem {
  filterToken: string;
  filterDoc?: vscode.MarkdownString;
  nonFilterDoc?: vscode.MarkdownString;

  constructor(label: string, filterToken: string) {
    super(label, vscode.CompletionItemKind.Color);

    this.filterToken = filterToken;
  }
}
