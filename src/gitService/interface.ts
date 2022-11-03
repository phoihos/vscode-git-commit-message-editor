import { Repository as GitRepository, Commit as GitCommitBase } from './git';

import * as vsceUtil from '@phoihos/vsce-util';

export { GitRepository };

export interface GitRemote {
  readonly name: string;
  readonly host: string;
  readonly owner: string;
  readonly repo: string;
}

export interface GitCommit extends GitCommitBase {
  readonly hashShort: string;
  readonly authorTimeAgo?: string;
  readonly commitTimeAgo?: string;
}

export interface Label {
  readonly name: string;
  readonly color: string;
  readonly url: string;
}

export interface Milestone {
  readonly title: string;
  readonly createdAt: string;
  readonly dueOn?: string;
  readonly url: string;
}

export interface GitIssue {
  readonly id: number;
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly url: string;
  // readonly author: IUser; // Not supported yet
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly state: string;
  readonly labels: Label[];
  readonly milestone?: Milestone;
  // readonly assignees?: IUser[]; // Not supported yet
  readonly isPR: boolean;
  readonly repository: GitRepository;
  readonly remote: GitRemote;
}

export interface GitDataQuery {
  readonly repository: GitRepository;
}

export interface GitCommitListQuery extends GitDataQuery {
  readonly maxEntries?: number;
}

export interface GitCommitQuery extends GitDataQuery {
  readonly hash: string;
}

export interface GitIssueListQuery extends GitDataQuery {
  readonly remote: GitRemote | undefined;
  readonly pagination?: { pageSize: number; page: number };
}

export interface GitIssueQuery extends GitDataQuery {
  readonly remote: GitRemote | undefined;
  readonly number: number;
}

export interface GitDataProvider extends vsceUtil.DisposableLike {
  readonly host: string;

  getCommits(query: GitCommitListQuery): Promise<GitCommit[]>;
  getCommit(query: GitCommitQuery): Promise<GitCommit | undefined>;
  getIssues(query: GitIssueListQuery): Promise<GitIssue[]>;
  getIssue(query: GitIssueQuery): Promise<GitIssue | undefined>;
  clearCache(query: GitDataQuery): void;
}
