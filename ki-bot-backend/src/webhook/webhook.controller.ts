import { Controller, Get, Post, Query, Body, ForbiddenException } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {

    // 🔐 Verificación de Meta
    @Get()
    verifyWebhook(
        @Query('hub.mode') mode: string,
        @Query('hub.verify_token') token: string,
        @Query('hub.challenge') challenge: string,
    ) {
        const VERIFY_TOKEN = "ki_bot_token";

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            return challenge;
        }

        throw new ForbiddenException('Error de verificación');
    }

    // 📩 Recibir mensajes
    @Post()
    handleMessage(@Body() body: any) {
        console.log(JSON.stringify(body, null, 2));
        return 'EVENT_RECEIVED';
    }
}
