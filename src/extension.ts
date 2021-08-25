// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import vsceUtil from '@phoihos/vsce-util';
import features from './features';

import getGitService, { IGitService } from './gitService';
import getConfiguration, { IConfiguration } from './configuration';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const git = getGitService();
  const config = getConfiguration();

  context.subscriptions.push(registerProviders(git, config));
  context.subscriptions.push(config);
  context.subscriptions.push(git);
}

function registerProviders(git: IGitService, config: IConfiguration): vscode.Disposable {
  const aggregateProviders = new vsceUtil.DisposableStore();

  aggregateProviders.add(new features.CommitEditmsgFileSystemProvider(git, config));
  aggregateProviders.add(new features.GitCommitCodeLensProvider(git, config));
  aggregateProviders.add(new features.GitCommitCompletionItemProvider(git, config));

  return aggregateProviders;
}

// this method is called when your extension is deactivated
export function deactivate() {}
