import { logger } from "./logger";

/**
 * Centralized error reporting utility.
 * Ready for Sentry or other monitoring tools.
 */
export const monitoring = {
  /**
   * Captures an exception with structured context.
   */
  captureException: (error: unknown, context: Record<string, any> = {}) => {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack, name: error.name }
      : { message: String(error) };

    // Log the error via structured logger
    logger.error({ 
      ...errorDetails,
      ...context,
      monitoring: true 
    }, "Captured Exception");

    // TODO: Integrate Sentry, Datadog, etc.
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, { extra: context });
    // }
  },

  /**
   * Tracks a performance metric.
   */
  trackMetric: (name: string, value: number, tags: Record<string, string> = {}) => {
    logger.info({
      metric: name,
      value,
      tags,
      monitoring: true
    }, `Metric: ${name}`);
  }
};
