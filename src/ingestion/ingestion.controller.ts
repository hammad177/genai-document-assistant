import {
  Controller,
  Post,
  Get,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { ALLOWED_DOC_EXTENSIONS } from 'src/common/constants';
import { SuccessMessage, UploadFiles } from 'src/common/decorators';
import { PDFParse } from 'pdf-parse';

@Controller('ingest')
export class IngestionController {
  constructor(private ingestionService: IngestionService) {}

  @Post()
  @SuccessMessage('Document ingested successfully')
  @UploadFiles([
    {
      fieldName: 'document',
      useMemory: true,
      allowedExtensions: ALLOWED_DOC_EXTENSIONS,
      maxCount: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    },
  ])
  async ingest(@UploadedFiles() files: Record<string, Express.Multer.File[]>) {
    if (!files?.document || files?.document?.length === 0) {
      throw new BadRequestException('No document uploaded');
    }

    const file = files.document[0];
    const filename = file.originalname;

    const parser = new PDFParse({ data: file.buffer });
    let content: string;

    try {
      const result = await parser.getText();
      content = result.text;
    } finally {
      await parser.destroy();
    }

    if (!content?.trim()) {
      throw new BadRequestException(
        'Could not extract readable text from the uploaded PDF',
      );
    }

    return this.ingestionService.ingestDocument(filename, content);
  }

  @Get()
  @SuccessMessage('Documents listed successfully')
  listDocuments() {
    return this.ingestionService.listDocuments();
  }
}
