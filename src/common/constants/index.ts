import { AllowedFileExtensions, AppEnvironment } from 'src/types';

export const QDRANT_DB = {
  URL: process.env.QDRANT_URL || 'http://localhost:6333',
  COLLECTION_NAME: process.env.QDRANT_COLLECTION || 'docs_assistant',
};

export const APP = {
  PORT: process.env.PORT || 8000,
  ENVIRONMENT: process.env.NODE_ENV || AppEnvironment.DEVELOPMENT,
  API_KEY: process.env.API_KEY || 'default_api_key',
};

export const OPEN_AI = {
  API_KEY: process.env.OPENAI_API_KEY || 'default_api_key',
  MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  EMBEDDING_MODEL:
    process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
};

export const REDIS = {
  URL: process.env.REDIS_URL || 'redis://localhost:6379',
  MEMORY_TTL_SECONDS: parseInt(
    process.env.REDIS_MEMORY_TTL_SECONDS || '3600',
    10,
  ),
  MEMORY_MAX_MESSAGES: parseInt(
    process.env.REDIS_MEMORY_MAX_MESSAGES || '10',
    10,
  ),
};

export const ALLOWED_DOC_EXTENSIONS: AllowedFileExtensions[] = ['.pdf'];

export const WHITELIST = {} as const;
