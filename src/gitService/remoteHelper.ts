/**
 * @description This is a modified version of the original code from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/common/protocol.ts
 */

import * as vscode from 'vscode';

import { IGitRepository, IGitRemote } from './interface';

function _getHostName(authority: string): string {
  // <username>:<password>@<authority>:<port>
  const matches = /^(?:.*:?@)?([^:]*)(?::.*)?$/.exec(authority);

  if (matches !== null && matches.length >= 2) {
    const hostName = matches[1].toLocaleLowerCase();
    // normalize to fix #903.
    // www.github.com will redirect anyways, so this is safe in this specific case, but potentially not in others.
    return hostName === 'www.github.com' ? 'github.com' : hostName;
  }

  return '';
}

function _getOwnerName(path: string): string {
  let normalized = path.replace(/\\/g, '/');
  if (normalized.endsWith('/')) {
    normalized = normalized.substr(0, normalized.length - 1);
  }

  const fragments = normalized.split('/');
  if (fragments.length > 1) {
    return fragments[fragments.length - 2];
  }

  return '';
}

function _getRepositoryName(path: string): string {
  let normalized = path.replace(/\\/g, '/');
  if (normalized.endsWith('/')) {
    normalized = normalized.substr(0, normalized.length - 1);
  }

  const lastIndex = normalized.lastIndexOf('/');
  const lastSegment = normalized.substr(lastIndex + 1);
  if (lastSegment === '' || lastSegment === '/') {
    return '';
  }

  return lastSegment.replace(/\/$/, '').replace(/\.git$/, '');
}

function _parseRemote(name: string, url: string): IGitRemote | undefined {
  if (url.length === 0) return undefined;

  const uri = vscode.Uri.parse(url);
  const remote: IGitRemote = {
    name,
    host: _getHostName(uri.authority),
    owner: _getOwnerName(uri.path),
    repo: _getRepositoryName(uri.path)
  };

  return remote.host.length > 0 ? remote : undefined;
}

export default function getOriginRemote(repository: IGitRepository): IGitRemote | undefined {
  const remoteName = repository.state.HEAD?.upstream?.remote.toLowerCase() ?? 'origin';

  const remote = repository.state.remotes.find((e) => e.name.toLowerCase() === remoteName);
  if (remote === undefined) return undefined;

  const remoteUrl = remote.fetchUrl ?? remote.pushUrl;
  if (remoteUrl === undefined) return undefined;

  return _parseRemote(remoteName, remoteUrl);
}