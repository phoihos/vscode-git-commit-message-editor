import * as vscode from 'vscode';

import { GitService } from '../../gitService';
import { Configuration } from '../../configuration';

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
import { GitCommitHoverProvider } from './gitCommitHoverProvider';

export class GitCommitIntelliSenseProvider extends vsceUtil.Disposable {
  private readonly _selector = 'git-commit';

  constructor(git: GitService, config: Configuration) {
    super();

    const createNewScopeCommand = new CreateNewScopeCommand(SCOPE_RANGE_REGEX, config);
    const formatSeparatorCommand = new FormatSeparatorCommand();
    const triggerSuggestCommand = new TriggerSuggestCommand();

    const summaryCompletionItemManager = new SummaryCompletionItemManager(
      createNewScopeCommand.id,
      git,
      config
    );
    const footerCompletionItemManager = new FooterCompletionItemManager(
      triggerSuggestCommand.id,
      git,
      config
    );

    const parserProxy = new TextDocumentParserProxy();

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
        parserProxy,
        config
      ),
      new FooterCompletionItemProvider(
        this._selector,
        footerCompletionItemManager,
        parserProxy,
        config
      ),
      new TextDocumentEventListener(
        this._selector,
        formatSeparatorCommand.id,
        triggerSuggestCommand.id,
        parserProxy,
        git
      ),
      new GitCommitHoverProvider(this._selector, parserProxy, git, config)
    );
    this.register(subscriptions);
  }
}
