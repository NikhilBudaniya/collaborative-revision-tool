export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RevisionLog {
  id: string;
  userId: string;
  status: RevisionStatus;
  timestamp: number;
  comment: string;
}

export interface RevisionState {
  status: RevisionStatus;
  lastUpdate: {
    userId: string;
    timestamp: number;
    comment: string;
  };
  history: RevisionLog[];
}
