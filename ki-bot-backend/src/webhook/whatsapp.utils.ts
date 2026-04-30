export class WhatsAppText {
    body: string;
}

export class WhatsAppMessage {
    from: string;
    id: string;
    timestamp: string;
    text?: WhatsAppText;
    type: string;
}

export class WhatsAppValue {
    messaging_product: string;
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: Array<{
        profile: {
            name: string;
        };
        wa_id: string;
    }>;
    messages?: WhatsAppMessage[];
    statuses?: any[];
}

export class WhatsAppChange {
    value: WhatsAppValue;
    field: string;
}

export class WhatsAppEntry {
    id: string;
    changes: WhatsAppChange[];
}

export class WhatsAppWebhookPayload {
    object: string;
    entry?: WhatsAppEntry[];
}

export class ExtractedWhatsAppMessage {
    phone: string;
    text: string;
}

/**
 * Extracts the sender's phone number and the text body from a WhatsApp webhook payload.
 * Returns null if the payload does not contain a valid text message.
 */
export function extractWhatsAppMessage(payload: WhatsAppWebhookPayload): ExtractedWhatsAppMessage | null {
    try {
        // Ensure it's a WhatsApp business account event
        if (payload?.object !== 'whatsapp_business_account') {
            return null;
        }

        // Safely navigate the nested Meta JSON structure using optional chaining
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        // If there's no message, or it's not a text message, return null
        if (!message || message.type !== 'text' || !message.text?.body) {
            return null;
        }

        return {
            phone: message.from,
            text: message.text.body,
        };
    } catch (error) {
        console.error('Error extracting WhatsApp message:', error);
        return null;
    }
}
