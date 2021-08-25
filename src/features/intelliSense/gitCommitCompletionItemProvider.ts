import * as vscode from 'vscode';

import { IGitService } from '../../gitService';
import { IConfiguration } from '../../configuration';

import * as vsceUtil from '@phoihos/vsce-util';
import { CreateNewScopeCommand } from './createNewScopeCommand';
import { FormatSeparatorCommand } from './formatSeparatorCommand';
import { TriggerSuggestCommand } from './triggerSuggestCommand';

import { SCOPE_RANGE_REGEX, SummaryCompletionItemManager } from './summaryCompletionItemManager';
import { FooterCompletionItemManager } from './footerCompletionItemManager';
import { TextDocumentParserProxy } from './textDocumentParserProxy';

import { SummaryCompletionItemProvider } from './summaryCompletionItemProvider';
import { FooterCompletionItemProvider } from './footerCompletionItemProvider';
import { TextDocumentEventListener } from './textDocumentEventListener';

export class GitCommitCompletionItemProvider extends vsceUtil.Disposable {
  private readonly _selector = 'git-commit';

  constructor(git: IGitService, config: IConfiguration) {
    super();

    const createNewScopeCommand = new CreateNewScopeCommand(SCOPE_RANGE_REGEX, config);
    const formatSeparatorCommand = new FormatSeparatorCommand();
    const triggerSuggestCommand = new TriggerSuggestCommand();

    const summaryCompletionItemManager = new SummaryCompletionItemManager(
      createNewScopeCommand.id,
      config
    );
    const footerCompletionItemManager = new FooterCompletionItemManager(
      triggerSuggestCommand.id,
      git,
      config
    );

    const textDocumentParserProxy = new TextDocumentParserProxy();

    const commandManager = new vsceUtil.CommandManager();
    commandManager.register(createNewScopeCommand);
    commandManager.register(formatSeparatorCommand);
    commandManager.register(triggerSuggestCommand);

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      commandManager,
      new SummaryCompletionItemProvider(
        this._selector,
        summaryCompletionItemManager,
        textDocumentParserProxy,
        config
      ),
      new FooterCompletionItemProvider(
        this._selector,
        footerCompletionItemManager,
        textDocumentParserProxy,
        config
      ),
      new TextDocumentEventListener(
        this._selector,
        formatSeparatorCommand.id,
        triggerSuggestCommand.id,
        footerCompletionItemManager,
        textDocumentParserProxy,
        git
      )
    );
    this.register(subscriptions);
  }
}
