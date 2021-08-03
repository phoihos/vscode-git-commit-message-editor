import * as vscode from 'vscode';
import * as vscodeGit from './git';

export interface IGitService {
  readonly api?: vscodeGit.API;
}

class GitService implements IGitService {
  private readonly _gitExtension =
    vscode.extensions.getExtension<vscodeGit.GitExtension>('vscode.git')!.exports;

  private _gitAPI: vscodeGit.API | undefined;
  public get api() {
    return this._gitAPI;
  }

  constructor() {
    this._gitExtension.onDidChangeEnablement(this._onDidChangeEnablement, this);
    this._onDidChangeEnablement(this._gitExtension.enabled);
  }

  private _onDidChangeEnablement(enabled: boolean) {
    this._gitAPI = enabled ? this._gitExtension.getAPI(1) : undefined;
  }
}

export default function getGitService(): IGitService {
  return new GitService();
}
