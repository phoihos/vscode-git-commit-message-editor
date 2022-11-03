import { components } from '@octokit/openapi-types';

import { GitRepository, GitRemote, GitIssue, Label, Milestone } from '../interface';

export type GitHubIssueModel = components['schemas']['issue'];

type GitHubLabelModel = {
  name: string;
  color: string;
};

type GitHubMilestoneModel = NonNullable<components['schemas']['nullable-milestone']>;

export class GitHubIssue implements GitIssue {
  get id(): number {
    return this._issue.id;
  }
  get number(): number {
    return this._issue.number;
  }
  get title(): string {
    return this._issue.title;
  }
  get body(): string {
    return this._issue.body ?? '';
  }
  get url(): string {
    return this._issue.html_url;
  }
  get createdAt(): string {
    return this._issue.created_at;
  }
  get updatedAt(): string {
    return this._issue.updated_at;
  }
  get state(): string {
    return this._issue.state;
  }
  get labels(): Label[] {
    return this._labels;
  }
  get milestone(): Milestone | undefined {
    return this._milestone;
  }
  get isPR(): boolean {
    return this._issue.pull_request !== undefined;
  }
  get repository(): GitRepository {
    return this._repository;
  }
  get remote(): GitRemote {
    return this._remote;
  }

  private readonly _repository: GitRepository;
  private readonly _remote: GitRemote;

  private readonly _issue: GitHubIssueModel;
  private readonly _labels: Label[];
  private readonly _milestone: Milestone | undefined;

  constructor(repository: GitRepository, remote: GitRemote, issue: GitHubIssueModel) {
    this._repository = repository;
    this._remote = remote;

    this._issue = issue;
    this._labels = this._makeLabels(issue, remote);
    this._milestone = this._makeMilestone(issue);
  }

  private _makeLabels(issue: GitHubIssueModel, remote: GitRemote): Label[] {
    const labels = issue.labels.reduce<GitHubLabelModel[]>((acc, e) => {
      if (typeof e === 'string') {
        acc.push({ name: e, color: '#ffffff' });
      } else {
        if (e.name !== undefined) {
          acc.push({ name: e.name, color: e.color ?? '#ffffff' });
        }
      }
      return acc;
    }, []);
    const ownerRepo = `${remote.owner}/${remote.repo}`;

    return labels.map((e): Label => {
      return {
        name: e.name,
        color: e.color,
        url: `https://github.com/${ownerRepo}/labels/${encodeURIComponent(e.name)}`
      };
    });
  }

  private _makeMilestone(issue: GitHubIssueModel): Milestone | undefined {
    const milestone = issue.milestone as GitHubMilestoneModel | null;

    return milestone !== null
      ? {
          title: milestone.title,
          createdAt: milestone.created_at,
          dueOn: milestone.due_on ?? undefined,
          url: milestone.html_url
        }
      : undefined;
  }
}

export function translateIssues(
  repository: GitRepository,
  remote: GitRemote,
  issues: GitHubIssueModel[]
): GitIssue[] {
  return issues.map((e) => {
    return new GitHubIssue(repository, remote, e);
  });
}
