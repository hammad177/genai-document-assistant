import {
  applyDecorators,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage, diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID as uuidv4 } from 'crypto';
import { AllowedFileExtensions } from 'src/types';
import { Request } from 'express';

interface UploadFilesOptions {
  fieldName: string;
  destination?: string;
  useMemory?: boolean;
  maxCount?: number;
  maxFileSize?: number; // in MB
  allowedExtensions?: AllowedFileExtensions[];
  getFilename?: (req: Request, file: Express.Multer.File) => string;
}

/**
 * Multi-field, multi-rule file upload decorator for NestJS
 */
export function UploadFiles(options: UploadFilesOptions[] = []) {
  if (!Array.isArray(options) || options.length === 0) {
    throw new BadRequestException(
      'UploadFiles requires at least one field option',
    );
  }

  const fieldConfigMap = new Map<string, UploadFilesOptions>();
  for (const field of options) {
    if (!field.fieldName) {
      throw new BadRequestException(
        'Each UploadFiles option must have a "fieldName"',
      );
    }
    fieldConfigMap.set(field.fieldName, field);
  }

  const fields = options.map((opt) => ({
    name: opt.fieldName,
    maxCount: opt.maxCount ?? 1,
  }));

  const storage = {
    _handleFile(req, file, cb) {
      const config = fieldConfigMap.get(file.fieldname);
      if (!config)
        return cb(
          new BadRequestException(`No config for field: ${file.fieldname}`),
          null,
        );

      const useMemory = config.useMemory ?? false;

      if (useMemory) {
        memoryStorage()._handleFile(req, file, cb);
      } else {
        const multerDiskStorage = diskStorage({
          destination: config.destination ?? './uploads',
          // filename: (req, file, cb) => {
          //   const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          //   cb(null, uniqueName);
          // },
          filename: (req, file, cb) => {
            try {
              let filename: string;

              if (config.getFilename) {
                filename = `${config.getFilename(req, file)}${extname(
                  file.originalname,
                )}`;
              } else {
                filename = `${uuidv4()}${extname(file.originalname)}`;
              }

              cb(null, filename);
            } catch (err) {
              cb(err, '');
            }
          },
        });
        multerDiskStorage._handleFile(req, file, cb);
      }
    },
    _removeFile(req, file, cb) {
      const config = fieldConfigMap.get(file.fieldname);
      const useMemory = config?.useMemory ?? false;

      if (useMemory) {
        memoryStorage()._removeFile(req, file, cb);
      } else {
        diskStorage({})._removeFile(req, file, cb);
      }
    },
  };

  const fileFilter = (req, file, cb) => {
    const config = fieldConfigMap.get(file.fieldname);
    const ext = extname(
      file.originalname,
    ).toLowerCase() as AllowedFileExtensions;

    if (!config) {
      return cb(
        new BadRequestException(`Unexpected file field: ${file.fieldname}`),
        false,
      );
    }

    if (config.allowedExtensions && !config.allowedExtensions.includes(ext)) {
      return cb(
        new BadRequestException(
          `Invalid file type for "${file.fieldname}". Allowed: ${config.allowedExtensions.join(', ')}`,
        ),
        false,
      );
    }

    cb(null, true);
  };

  const maxFileSizeBytes =
    Math.max(...options.map((opt) => opt.maxFileSize ?? 1000)) * 1024 * 1024; // in bytes

  return applyDecorators(
    UseInterceptors(
      FileFieldsInterceptor(fields, {
        storage,
        fileFilter,
        limits: {
          fileSize: maxFileSizeBytes,
        },
      }),
    ),
  );
}
