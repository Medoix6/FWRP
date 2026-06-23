export interface Rating {
  id: string;
  donationId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string;
  createdAt: string;
}
