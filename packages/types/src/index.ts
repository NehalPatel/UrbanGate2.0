/** Shared API error envelope (ADR-010). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    correlationId: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}
