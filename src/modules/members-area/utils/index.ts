/**
 * Members Area Utils - Public Exports
 */

export { normalizeContentType } from './content-type';

export {
  validateVideoUrl,
  validatePdfUrl,
  validateDownloadUrl,
  type VideoPlatform,
} from './content-validator';

export {
  calculateContentProgress,
  isContentComplete,
  calculateModuleProgress,
  calculateOverallProgress,
  formatWatchTime,
  formatDuration,
  estimateRemainingTime,
} from './progress-calculator';
