import prisma from "../prisma";

export interface CalibrationResult {
  sampleId: string;
  questionId: string;
  dimension: string;
  expected: number;
  actual: number;
  delta: number;
}

/**
 * Fetches all active calibration samples.
 */
export async function getCalibrationSamples() {
  return prisma.calibrationSample.findMany({
    include: {
      question: true,
    },
  });
}

/**
 * Updates the last tested timestamp for a sample.
 */
export async function updateCalibrationTimestamp(id: string) {
  return prisma.calibrationSample.update({
    where: { id },
    data: { lastTestedAt: new Date() },
  });
}
