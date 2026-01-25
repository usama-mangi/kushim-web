import { KushimStandardRecord } from '../../common/ksr.interface';
import { PlatformCredentials } from '../../common/oauth-credentials.types';
import { Logger } from '@nestjs/common';

export abstract class BaseAdapter {
  protected readonly logger: Logger;
  
  abstract name: string;
  abstract fetch(credentials: PlatformCredentials, lastSync?: Date): Promise<any[]>;
  abstract normalize(rawRecord: any): KushimStandardRecord;

  constructor() {
    this.logger = new Logger(this.constructor.name);
  }
}
