import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { APP } from '../constants';

// Custom Guard for API Key validation
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKeyFromHeader = request.headers['x-api-key'];

    if (!apiKeyFromHeader) {
      throw new UnauthorizedException('API key is missing');
    }

    const expectedApiKey = APP.API_KEY;

    if (apiKeyFromHeader?.trim() !== expectedApiKey?.trim()) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
