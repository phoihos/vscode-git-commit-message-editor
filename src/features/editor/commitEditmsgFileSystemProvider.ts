import * as vscode from 'vscode';
import { TextEncoder, TextDecoder } from 'util';

import { IGitService } from '../../gitService';
import { IConfiguration } from '../../configuration';

import * as vsceUtil from '@phoihos/vsce-util';
import { OpenEditorCommand } from './openEditorCommand';

export class CommitEditmsgFileSystemProvider
  extends vsceUtil.Disposable
  implements vscode.FileSystemProvider
{
  private readonly _scheme = 'commit-editmsg';
  private readonly _encorder = new TextEncoder();
  private readonly _decorder = new TextDecoder();

  private readonly _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();

  private readonly _git: IGitService;
  private readonly _config: IConfiguration;

  constructor(git: IGitService, config: IConfiguration) {
    super();

    const command = new OpenEditorCommand(this._scheme, git);

    this._git = git;
    this._config = config;

    const subscriptions: vscode.Disposable[] = [];
    subscriptions.push(
      vscode.commands.registerCommand(command.id, command.execute, command),
      vscode.workspace.registerFileSystemProvider(this._scheme, this)
    );
    this.register(subscriptions);
  }

  public get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  public watch(
    _uri: vscode.Uri,
    _options: { recursive: boolean; excludes: string[] }
  ): vscode.Disposable {
    return new vscode.Disposable(() => {});
  }

  public stat(_uri: vscode.Uri): vscode.FileStat {
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: 0
    };
  }

  public readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] {
    return [];
  }

  public createDirectory(_uri: vscode.Uri): void {
    throw new Error('Method not implemented.');
  }

  public readFile(uri: vscode.Uri): Uint8Array {
    const repository = this._git.getRepository(uri);
    if (repository === undefined) return new Uint8Array();

    return this._encorder.encode(repository.inputBox.value);
  }

  public writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    _options: { create: boolean; overwrite: boolean }
  ): void | Thenable<void> {
    const repository = this._git.getRepository(uri);
    if (repository === undefined) return new Promise(() => {});

    const message = this._decorder.decode(content);

    // strip trailing whitespaces
    repository.inputBox.value = message.replace(/\s+$/, '').replace(/[\t\f\v ]+(\r?\n)/g, '$1');

    if (this._config.keepAfterSave === false) {
      (async () => {
        await vscode.commands.executeCommand('vscode.open', uri);
        await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
        await vscode.commands.executeCommand('workbench.scm.focus');
      })();
    }
  }

  public delete(_uri: vscode.Uri, _options: { recursive: boolean }): void {
    throw new Error('Method not implemented.');
  }

  public rename(_oldUri: vscode.Uri, _newUri: vscode.Uri, _options: { overwrite: boolean }): void {
    throw new Error('Method not implemented.');
  }
}
