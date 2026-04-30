import { Controller, Get, Post, Query, Body, ForbiddenException } from '@nestjs/common';
import { extractWhatsAppMessage, WhatsAppWebhookPayload } from './whatsapp.utils';

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
    handleMessage(@Body() body: WhatsAppWebhookPayload) {
        // Extraemos los datos de manera segura y fuertemente tipada
        const extractedData = extractWhatsAppMessage(body);

        if (extractedData) {
            console.log(`Mensaje recibido de ${extractedData.phone}: ${extractedData.text}`);
            // Aquí puedes agregar la lógica para responder el mensaje
        } else {
            console.log('Evento recibido, pero no es un mensaje de texto válido.', JSON.stringify(body, null, 2));
        }

        return 'EVENT_RECEIVED';
    }
}
