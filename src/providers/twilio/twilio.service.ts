import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PQueue from 'p-queue';
import pRetry from 'p-retry';
import { Configuration } from 'src/config/configuration.interface';
import twilio from 'twilio';
import { MessageListInstanceCreateOptions } from 'twilio/lib/rest/api/v2010/account/message';
import TwilioClient from 'twilio/lib/rest/Twilio';

@Injectable()
export class TwilioService {
  client: TwilioClient;
  logger = new Logger(TwilioService.name);
  private smsConfig = this.configService.get<Configuration['sms']>('sms');
  private queue = new PQueue({ concurrency: 1 });

  constructor(private configService: ConfigService) {
    const twilioAccountSid = this.smsConfig.twilioAccountSid;
    const twilioAuthToken = this.smsConfig.twilioAuthToken;
    if (!twilioAccountSid || !twilioAuthToken)
      this.logger.warn('Twilio account SID/auth token not found');
    this.client = twilio(
      twilioAccountSid || 'ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      twilioAuthToken || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    );
  }

  send(options: MessageListInstanceCreateOptions) {
    this.queue
      .add(() =>
        pRetry(() => this.sendSms(options), {
          retries: this.smsConfig.retries,
          onFailedAttempt: (error) => {
            this.logger.error(
              `SMS to ${options.to} failed, retrying (${error.retriesLeft} attempts left)`,
              error.name,
            );
          },
        }),
      )
      .then(() => {})
      .catch(() => {});
  }

  private async sendSms(options: MessageListInstanceCreateOptions) {
    return this.client.messages.create(options);
  }
}
