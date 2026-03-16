
/**
 * NOTE! Types are shared between server and client.
 * Keep them in sync.
 */
export type ChatRecord = {
  id: number;
  title: string;
  username?: string;
  count: number; // number of messages
}

/**
 * StatRecord is a type that represents a stat record.
 * It is used to store the stat record in the database.
 */
export type StatRecord = {
  messageId: number;
  date: string; // YYYY-MM-DD
  records: ChatRecord[];
}
