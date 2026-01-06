export interface NormalizedRecord {
  id: string;
  payload: any;
  checksum: string;
}

export abstract class BaseAdapter {
  abstract name: string;
  abstract fetch(credentials: any): Promise<any[]>;
  abstract normalize(rawRecord: any): NormalizedRecord;
}
