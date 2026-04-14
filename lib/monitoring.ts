import { logger } from "./logger";

/**
 * Centralized error reporting and performance tracking utility.
 * Environment-aware: Logs more detail in development, remains structured in production.
 */
export const monitoring = {
  /**
   * Captures an exception with structured context.
   * If SENTRY_DSN is present in the future, this is the single point of integration.
   */
  captureException: (error: unknown, context: Record<string, unknown> = {}) => {
    const isDev = process.env.NODE_VERSION === "development";
    const errorDetails = error instanceof Error 
      ? { 
          message: error.message, 
          stack: isDev ? error.stack : undefined, 
          name: error.name,
          code: (error as { code?: string }).code
        }
      : { message: String(error) };

    // Structured logging for production observability
    logger.error({ 
      ...errorDetails,
      ...context,
      monitoring: true,
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString()
    }, "Critical Exception Captured");

    // Placeholder for Sentry/Datadog integration
    if (process.env.SENTRY_DSN) {
      // Sentry.captureException(error, { extra: context });
    }
  },

  /**
   * Simple timer utility for measuring operation duration.
   */
  startTimer: (operation: string, metadata: Record<string, unknown> = {}) => {
    const start = performance.now();
    return {
      stop: () => {
        const duration = performance.now() - start;
        monitoring.trackAIPerformance(operation, duration, metadata);
        return duration;
      }
    };
  },

  /**
   * Tracks performance metrics specifically for AI operations.
   */
  trackAIPerformance: (operation: string, latencyMs: number, metadata: Record<string, unknown> = {}) => {
    logger.info({
      metric: "ai_latency",
      operation,
      latencyMs,
      ...metadata,
      monitoring: true
    }, `AI Performance: ${operation} took ${latencyMs}ms`);
  },

  /**
   * Tracks system health metrics.
   */
  trackMetric: (name: string, value: number, tags: Record<string, string> = {}) => {
    logger.info({
      metric: name,
      value,
      tags,
      monitoring: true
    }, `Metric: ${name} = ${value}`);
  }
};
