import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsAppService } from './whatsapp.service';

@Module({
    imports: [HttpModule],
    providers: [WhatsAppService],
    exports: [WhatsAppService], // Export it so other modules (like WebhookModule) can use it
})
export class WhatsAppModule {}
