// WhatsApp Business API types

// WhatsApp message types
export type WhatsAppMessageType = 'text' | 'template' | 'image' | 'video' | 'audio' | 'document' | 'location' | 'contact' | 'sticker';

// WhatsApp message status
export type WhatsAppMessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

// WhatsApp template status
export type WhatsAppTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// WhatsApp template category
export type WhatsAppTemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

// WhatsApp template language
export type WhatsAppTemplateLanguage = 'en_US' | 'en_GB' | 'es_ES' | 'fr_FR' | 'de_DE' | 'it_IT' | 'pt_BR' | 'hi_IN';

// WhatsApp template component types
export type WhatsAppComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';

// WhatsApp button types
export type WhatsAppButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

// WhatsApp template structure
export interface WhatsAppTemplate {
  name: string;
  language: {
    code: WhatsAppTemplateLanguage;
  };
  category: WhatsAppTemplateCategory;
  components: WhatsAppTemplateComponent[];
  status: WhatsAppTemplateStatus;
}

// WhatsApp template component
export interface WhatsAppTemplateComponent {
  type: WhatsAppComponentType;
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: WhatsAppButton[];
}

// WhatsApp button
export interface WhatsAppButton {
  type: WhatsAppButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

// WhatsApp message payload
export interface WhatsAppMessagePayload {
  messaging_product: 'whatsapp';
  to: string;
  type: WhatsAppMessageType;
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: WhatsAppTemplateLanguage;
    };
    components?: WhatsAppMessageComponent[];
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
}

// WhatsApp message component
export interface WhatsAppMessageComponent {
  type: WhatsAppComponentType;
  parameters?: WhatsAppParameter[];
  sub_type?: string;
  index?: number;
}

// WhatsApp parameter
export interface WhatsAppParameter {
  type: 'text' | 'image' | 'document' | 'video' | 'audio';
  text?: string;
  image?: {
    link: string;
  };
  document?: {
    link: string;
    filename?: string;
  };
  video?: {
    link: string;
  };
  audio?: {
    link: string;
  };
}

// WhatsApp API response
export interface WhatsAppApiResponse {
  messaging_product: 'whatsapp';
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

// WhatsApp webhook payload
export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppWebhookContact[];
    messages?: WhatsAppWebhookMessage[];
    statuses?: WhatsAppWebhookStatus[];
  };
  field: 'messages';
}

export interface WhatsAppWebhookContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string; // Allow any string for flexibility
  text?: {
    body: string;
  };
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string; // Add optional caption
  };
  document?: {
    id: string;
    filename: string;
    mime_type: string;
    sha256: string;
    caption?: string; // Add optional caption
  };
}

export interface WhatsAppWebhookStatus {
  id: string;
  status: WhatsAppMessageStatus;
  timestamp: string;
  recipient_id: string;
  conversation: {
    id: string;
    origin: {
      type: string;
    };
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}
