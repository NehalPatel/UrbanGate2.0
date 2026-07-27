import { Injectable, Logger } from '@nestjs/common';
import { loadEnv } from '@urbangate/config';

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly driver: string;

  constructor() {
    this.driver = loadEnv().EMAIL_DRIVER;
  }

  async send(message: EmailMessage): Promise<void> {
    if (this.driver === 'console') {
      this.logger.log(
        `[email:console] to=${message.to} subject=${JSON.stringify(message.subject)} body=${JSON.stringify(message.text)}`,
      );
      return;
    }
    this.logger.warn(`EMAIL_DRIVER=${this.driver} not configured; logging to console`);
    this.logger.log(
      `[email:fallback] to=${message.to} subject=${JSON.stringify(message.subject)}`,
    );
  }
}
