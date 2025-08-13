import axios from "axios";

export interface TemplateDefinition {
  name: string;
  language: string; // e.g., en_US
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    text?: string;
    example?: any;
    buttons?: Array<{
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
      text?: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
}

export type TemplateStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "PAUSED"
  | "INAPPEAL";

export interface TemplateManagerOptions {
  baseUrl: string; // e.g., https://graph.facebook.com/v20.0
  accessToken: string;
  businessId: string; // WhatsApp Business Account ID (WABA)
}

export class TemplateManager {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly businessId: string;

  constructor(options: TemplateManagerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.businessId = options.businessId;
  }

  async create(template: TemplateDefinition) {
    const url = `${this.baseUrl}/${this.businessId}/message_templates`;
    const { data } = await axios.post(url, template, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async getAll(limit = 50) {
    const url = `${this.baseUrl}/${this.businessId}/message_templates?limit=${limit}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async get(templateName: string) {
    const url = `${this.baseUrl}/${this.businessId}/message_templates?name=${encodeURIComponent(
      templateName
    )}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async delete(templateName: string, language = "en_US") {
    const url = `${this.baseUrl}/${this.businessId}/message_templates`;
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      data: { name: templateName, language },
    });
    return data;
  }

  async status(templateName: string) {
    const data = await this.get(templateName);
    const item = data?.data?.find((t: any) => t.name === templateName);
    return item?.status as TemplateStatus | undefined;
  }
}
