import axios from "axios";

export interface TemplateDefinition {
  name: string;
  language: string; // e.g., en_US
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    text?: string;
    example?: unknown;
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
  baseUrl: string; // e.g., https://graph.facebook.com/v21.0
  accessToken: string;
  businessId: string; // WhatsApp Business Account ID (WABA) - kept for backward compatibility
  phoneNumberId: string; // WhatsApp Phone Number ID - required for templates
}

export class TemplateManager {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly businessId: string;
  private readonly phoneNumberId: string;

  constructor(options: TemplateManagerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.businessId = options.businessId;
    this.phoneNumberId = options.phoneNumberId;
  }

  async create(template: TemplateDefinition) {
    // Use phoneNumberId as the business ID for template operations
    const url = `${this.baseUrl}/${this.phoneNumberId}/message_templates`;
    const { data } = await axios.post(url, template, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async getAll(limit = 50) {
    // Use phoneNumberId as the business ID for template operations
    const url = `${this.baseUrl}/${this.phoneNumberId}/message_templates?limit=${limit}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async get(templateName: string) {
    // Use phoneNumberId as the business ID for template operations
    const url = `${this.baseUrl}/${this.phoneNumberId}/message_templates?name=${encodeURIComponent(
      templateName,
    )}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async delete(templateName: string, language = "en_US") {
    // Use phoneNumberId as the business ID for template operations
    const url = `${this.baseUrl}/${this.phoneNumberId}/message_templates`;
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
      data: { name: templateName, language },
    });
    return data;
  }

  async status(templateName: string) {
    const data = await this.get(templateName);
    const item = (
      data?.data as Array<{ name: string; status?: TemplateStatus }> | undefined
    )?.find((t) => t.name === templateName);
    return item?.status as TemplateStatus | undefined;
  }
}
