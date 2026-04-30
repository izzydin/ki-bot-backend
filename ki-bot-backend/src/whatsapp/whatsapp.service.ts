import { Injectable, Logger } from '@nestjs/common';
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
        const phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';
        this.token = this.configService.get<string>('WHATSAPP_TOKEN') || '';
        
        if (!phoneNumberId || !this.token) {
            this.logger.warn('WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_TOKEN is not set in environment variables');
        }

        // Using API v18.0 as a standard recent version, can be made dynamic if needed
        this.apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    }

    /**
     * Sends a text message to a WhatsApp user
     * @param to Phone number with country code (e.g., "16505551234")
     * @param message The text content to send
     */
    async sendTextMessage(to: string, message: string): Promise<any> {
        this.logger.log(`Sending message to ${to}...`);

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
                        this.logger.error(
                            `Failed to send message to ${to}: ${error.message}`,
                            error.response?.data ? JSON.stringify(error.response.data) : '',
                        );
                        throw error;
                    }),
                ),
            );

            const messageId = response.data?.messages?.[0]?.id;
            this.logger.log(`Message successfully sent to ${to}. Message ID: ${messageId}`);
            
            return response.data;
        } catch (error) {
            // Rethrow or handle based on your domain needs
            throw new Error(`WhatsApp API Error: Could not send message to ${to}`);
        }
    }
}
