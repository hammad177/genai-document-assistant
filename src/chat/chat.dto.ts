import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class QueryDto {
  @IsString()
  @IsNotEmpty()
  @Trim()
  question: string;
}

export class AgentQueryDto extends QueryDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
