/**
 * @description This is a modified version of the original code from https://github.com/microsoft/vscode-pull-request-github/blob/main/src/common/protocol.ts
 */

import * as vscode from 'vscode';

import { IGitRepository, IGitRemote } from './interface';

const HTTP_AUTH_REGEX = /^(?:.*:?@)?([^:]*)(?::.*)?$/; // <username>:<password>@<authority>:<port>

function _getHostName(authority: string): string {
  const matches = HTTP_AUTH_REGEX.exec(authority);

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
    normalized = normalized.substring(0, normalized.length - 1);
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
    normalized = normalized.substring(0, normalized.length - 1);
  }

  const lastIndex = normalized.lastIndexOf('/');
  const lastSegment = normalized.substring(lastIndex + 1);
  if (lastSegment === '' || lastSegment === '/') {
    return '';
  }

  return lastSegment.replace(/\/$/, '').replace(/\.git$/, '');
}

const URL_SCHEME_REGEX = /^([A-Za-z0-9+.-]+):\/\//; // <protocol>://
const SSH_URL_REGEX = /^(?:([^@:]+)@)?([^:/]+):?(.+)$/; // <ssh-info>@<hostname>:<repo-path>

function _parseSshUrl(name: string, url: string): IGitRemote | undefined {
  const urlSchemeMatch = URL_SCHEME_REGEX.exec(url);
  if (urlSchemeMatch !== null) {
    const fullSchemePrefix = urlSchemeMatch[0];
    const scheme = urlSchemeMatch[1].toLocaleLowerCase();
    if (scheme === 'ssh' || scheme === 'git+ssh') {
      url = url.slice(fullSchemePrefix.length);
    } else {
      return undefined;
    }
  }
  const sshUrlMatch = SSH_URL_REGEX.exec(url);
  if (sshUrlMatch === null) return undefined;

  const [, , hostName, path] = sshUrlMatch;
  const remote: IGitRemote = {
    name,
    host: hostName.toLocaleLowerCase(),
    owner: _getOwnerName(path),
    repo: _getRepositoryName(path)
  };

  return remote.host.length > 0 ? remote : undefined;
}

function _parseHttpUrl(name: string, url: string): IGitRemote | undefined {
  const uri = vscode.Uri.parse(url);
  const remote: IGitRemote = {
    name,
    host: _getHostName(uri.authority),
    owner: _getOwnerName(uri.path),
    repo: _getRepositoryName(uri.path)
  };

  return remote.host.length > 0 ? remote : undefined;
}

function _parseRemoteUrl(name: string, url: string): IGitRemote | undefined {
  if (url.length === 0) return undefined;

  return _parseSshUrl(name, url) ?? _parseHttpUrl(name, url);
}

export default function getOriginRemote(repository: IGitRepository): IGitRemote | undefined {
  const remoteName = repository.state.HEAD?.upstream?.remote.toLowerCase() ?? 'origin';

  const remote = repository.state.remotes.find((e) => e.name.toLowerCase() === remoteName);
  if (remote === undefined) return undefined;

  const remoteUrl = remote.fetchUrl ?? remote.pushUrl;
  if (remoteUrl === undefined) return undefined;

  return _parseRemoteUrl(remoteName, remoteUrl);
}
