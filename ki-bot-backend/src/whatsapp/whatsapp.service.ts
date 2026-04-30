import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly apiUrl: string;
    private readonly token: string;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) {
        // El operador ! le dice a TypeScript que estamos seguros de que existe
        // porque Joi lo valida estrictamente al iniciar la app.
        const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID')!;
        this.token = this.configService.get<string>('WHATSAPP_TOKEN')!;

        // Using API v18.0 as a standard recent version, can be made dynamic if needed
        this.apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    }

    /**
     * Sends a text message to a WhatsApp user
     * @param to Phone number with country code (e.g., "16505551234")
     * @param message The text content to send
     */
    async sendTextMessage(to: string, message: string): Promise<any> {
        this.logger.debug(`[OUTGOING_PREP] Preparando mensaje de texto para ${to}`);

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: {
                preview_url: false,
                body: message,
            },
        };

        const headers = {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        };

        try {
            const response = await firstValueFrom(
                this.httpService.post(this.apiUrl, payload, { headers }).pipe(
                    catchError((error: AxiosError) => {
                        // 1. Extraemos el mensaje de error real de Meta (si existe)
                        const metaError = (error.response?.data as any)?.error?.message || error.message;
                        const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;

                        // 2. Logueamos el error con todo el contexto
                        this.logger.error(
                            `[WHATSAPP_API_ERROR] Fallo al enviar mensaje a ${to}. HTTP ${statusCode}. Motivo: ${metaError}`,
                            error.response?.data ? JSON.stringify(error.response.data) : error.stack,
                        );
                        
                        // 3. Lanzamos una excepción estándar de NestJS que nuestro controlador pueda entender
                        throw new HttpException(`Error de WhatsApp API: ${metaError}`, statusCode);
                    }),
                ),
            );

            const messageId = response.data?.messages?.[0]?.id;
            this.logger.log(`[OUTGOING_SUCCESS] Mensaje enviado a ${to} | MessageID: ${messageId}`);
            
            return response.data;
        } catch (error) {
            // 4. Si el error ya es una HttpException (la que lanzamos arriba), la dejamos pasar
            if (error instanceof HttpException) {
                throw error;
            }
            // 5. Si es otro tipo de error (ej. error de red, fallo de Node), lanzamos un 500 genérico
            throw new HttpException(
                `Fallo inesperado al enviar mensaje a ${to}`, 
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
