import { BadGatewayException } from './BadGatewayException';
import { BadRequestException } from './BadRequestException';
import { ForbiddenException } from './ForbiddenException';
import { GatewayTimeoutException } from './GatewayTimeoutException';
import { HttpException } from './HttpException';
import { InternalServerException } from './InternalServerException';
import { NotFoundException } from './NotFoundException';
import { RateLimitException } from './RateLimitException';
import { UnauthorizedException } from './UnauthorizedException';
import { UnavailableException } from './UnavailableException';

export function getHttpException(code: number): HttpException | null {
  switch (code) {
    case 400:
      return new BadRequestException();
    case 401:
      return new UnauthorizedException();
    case 403:
      return new ForbiddenException();
    case 404:
      return new NotFoundException();
    case 429:
      return new RateLimitException();
    case 500:
      return new InternalServerException();
    case 502:
      return new BadGatewayException();
    case 503:
      return new UnavailableException();
    case 504:
      return new GatewayTimeoutException();
    default:
      return new HttpException(code);
  }
}
