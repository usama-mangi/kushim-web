import { KushimStandardRecord } from '../../common/ksr.interface';

export abstract class BaseAdapter {
  abstract name: string;
  abstract fetch(credentials: any, lastSync?: Date): Promise<any[]>;
  abstract normalize(rawRecord: any): KushimStandardRecord;
}
