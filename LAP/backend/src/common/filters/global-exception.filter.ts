import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const body = exception instanceof HttpException ? exception.getResponse() : {};
    response.status(status).json({
      success: false,
      message: typeof body === 'object' && body && 'message' in body ? body.message : 'Internal server error',
      errorCode: status === 400 ? 'VALIDATION_ERROR' : 'REQUEST_FAILED',
      errors: typeof body === 'object' && body && 'message' in body ? body.message : [],
      requestId: request.requestId
    });
  }
}
