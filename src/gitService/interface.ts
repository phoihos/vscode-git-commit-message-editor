import { Repository as IGitRepository, Commit as IGitCommitBase } from './git';

import * as vsceUtil from '@phoihos/vsce-util';

export { IGitRepository };

export interface IGitRemote {
  readonly name: string;
  readonly host: string;
  readonly owner: string;
  readonly repo: string;
}

export interface IGitCommit extends IGitCommitBase {
  readonly hashShort: string;
  readonly authorTimeAgo?: string;
  readonly commitTimeAgo?: string;
}

export interface ILabel {
  readonly name: string;
  readonly color: string;
  readonly url: string;
}

export interface IMilestone {
  readonly title: string;
  readonly createdAt: string;
  readonly dueOn?: string;
  readonly url: string;
}

export interface IGitIssue {
  readonly id: number;
  readonly number: number;
  readonly title: string;
  readonly body: string;
  readonly url: string;
  // readonly author: IUser; // Not supported yet
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly state: string;
  readonly labels: ILabel[];
  readonly milestone?: IMilestone;
  // readonly assignees?: IUser[]; // Not supported yet
  readonly isPR: boolean;
  readonly repository: IGitRepository;
  readonly remote: IGitRemote;
}

export interface IGitDataQuery {
  readonly repository: IGitRepository;
}

export interface IGitCommitQuery extends IGitDataQuery {
  readonly maxEntries?: number;
}

export interface IGitIssueQuery extends IGitDataQuery {
  readonly remote: IGitRemote | undefined;
  readonly pagination?: { per_page: number; page: number };
}

export interface IGitDataProvider extends vsceUtil.IDisposable {
  readonly host: string;

  getCommits(query: IGitCommitQuery): Promise<IGitCommit[]>;
  getIssues(query: IGitIssueQuery): Promise<IGitIssue[]>;
  clearCache(query: IGitDataQuery): void;
}
