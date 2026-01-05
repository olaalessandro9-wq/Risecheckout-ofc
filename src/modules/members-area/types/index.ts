/**
 * Members Area Types - Public Exports
 */

// Module & Content types
export type {
  ContentType,
  ReleaseType,
  MemberContent,
  ContentWithRelease,
  ContentReleaseSettings,
  MemberModule,
  ModuleWithContents,
  CreateModuleInput,
  UpdateModuleInput,
  CreateContentInput,
  UpdateContentInput,
  EditingModuleData,
} from './module.types';

// Group types
export type {
  MemberGroup,
  GroupPermission,
  GroupWithPermissions,
  BuyerGroup,
  BuyerWithGroups,
  CreateGroupInput,
  UpdateGroupInput,
  UpdatePermissionsInput,
  AssignBuyerGroupsInput,
  StudentStats,
  StudentFilters,
} from './group.types';

// Progress types
export type {
  ProgressStatus,
  ContentProgress,
  ContentProgressWithDetails,
  ModuleProgress,
  OverallProgress,
  ProgressSummary,
  UpdateProgressInput,
  MarkCompleteInput,
  ContentAccessStatus,
} from './progress.types';

// Quiz types
export type {
  QuestionType,
  Quiz,
  QuizQuestion,
  QuizAnswer,
  QuestionWithAnswers,
  QuizWithQuestions,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizResult,
  CreateQuizInput,
  CreateQuestionInput,
  CreateAnswerInput,
  SubmitQuizInput,
} from './quiz.types';

// Certificate types
export type {
  CertificateTemplate,
  Certificate,
  CertificateMetadata,
  CertificateVerification,
  CreateTemplateInput,
  UpdateTemplateInput,
  GenerateCertificateInput,
  CertificateWithTemplate,
} from './certificate.types';
