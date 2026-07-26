import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@urbangate/types';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'urbangate-api',
      timestamp: new Date().toISOString(),
    };
  }
}
