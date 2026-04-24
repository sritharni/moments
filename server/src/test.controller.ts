import { Controller, Get } from '@nestjs/common';

@Controller('test')
export class TestController {
  @Get()
  getStatus() {
    return {
      ok: true,
      message: 'Server is working',
      timestamp: new Date().toISOString(),
    };
  }
}
