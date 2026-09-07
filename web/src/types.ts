export interface Entry {
  rank: number;
  trend: number;
  user_guid: string;
  user_name: string;
  team_name: string;
  points: number;
  roster: string[];
}

export interface Snapshot {
  fetched_at: string;
  source_time: string;
  entries: Entry[];
}
