import { Controller, Get, Post, Query, Body, ForbiddenException, Logger } from '@nestjs/common';
import { extractWhatsAppMessage, WhatsAppWebhookPayload } from './whatsapp.utils';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Controller('webhook')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly whatsappService: WhatsAppService) {}

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
    async handleMessage(@Body() body: WhatsAppWebhookPayload) {
        try {
            // 1. Extraemos los datos de manera segura
            const extractedData = extractWhatsAppMessage(body);

            // 2. Si no es un mensaje de texto válido, salimos temprano (Return early)
            if (!extractedData) {
                return 'EVENT_RECEIVED';
            }

            const { phone, text } = extractedData;

            // 3. Log estructurado del mensaje entrante
            this.logger.log(`[INCOMING_MSG] Phone: ${phone} | Text: "${text}"`);

            // 4. Enviamos una respuesta usando el servicio inyectado
            await this.whatsappService.sendTextMessage(phone, 'Hola 👋 soy Ki Bot');

            return 'EVENT_RECEIVED';
        } catch (error) {
            // 5. Manejo de errores con contexto estructurado
            this.logger.error(
                `[WEBHOOK_ERROR] Fallo al procesar el mensaje entrante`,
                error instanceof Error ? error.stack : JSON.stringify(error)
            );
            // Meta espera siempre un status 200, si fallamos debemos evitar que Meta reintente infinitamente
            return 'EVENT_RECEIVED';
        }
    }
}
