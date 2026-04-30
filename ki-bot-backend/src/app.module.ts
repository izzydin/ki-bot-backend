import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhook/webhook.controller';
import { WhatsAppModule } from './whatsapp/whatsapp.module';

import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        WHATSAPP_PHONE_NUMBER_ID: Joi.string().required(),
        WHATSAPP_TOKEN: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    WhatsAppModule,
  ],
  controllers: [AppController, WebhookController],
  providers: [AppService],
})
export class AppModule {}
