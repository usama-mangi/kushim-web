import { KushimStandardRecord } from '../../common/ksr.interface';
import { Logger } from '@nestjs/common';

export abstract class BaseAdapter {
  protected readonly logger: Logger;
  
  abstract name: string;
  abstract fetch(credentials: any, lastSync?: Date): Promise<any[]>;
  abstract normalize(rawRecord: any): KushimStandardRecord;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }
}
