import "dotenv/config";
import path from "path";
import axios, { AxiosError } from "axios";

// Load environment variables from the project root
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "../../.env") });

export interface TemplateDefinition {
  name: string;
  language: string; // e.g., en_US
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "CAROUSEL";
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    text?: string;
    example?: unknown;
    buttons?: Array<{
      type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
      text?: string;
      url?: string;
      phone_number?: string;
    }>;
    cards?: Array<{
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

  async uploadMedia(fileUrl: string, type: "image" | "video" = "image") {
    console.log("📤 Template Manager - Starting media upload...");
    console.log("🔗 Template Manager - File URL:", fileUrl);
    console.log("📁 Template Manager - File type:", type);

    try {
      // First, download the file
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);

      console.log("📥 Template Manager - Downloaded file, size:", buffer.length, "bytes");

      // Create form data for upload
      const FormData = await import('form-data');
      const form = new FormData.default();
      form.append('messaging_product', 'whatsapp');
      form.append('file', buffer, {
        filename: `upload.${type === 'image' ? 'jpg' : 'mp4'}`,
        contentType: type === 'image' ? 'image/jpeg' : 'video/mp4'
      });

      const uploadUrl = `${this.baseUrl}/${this.phoneNumberId}/media`;
      console.log("🔗 Template Manager - Upload URL:", uploadUrl);

      const uploadResponse = await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      console.log("✅ Template Manager - Media upload successful");
      console.log("📋 Template Manager - Upload response:", JSON.stringify(uploadResponse.data, null, 2));

      return uploadResponse.data;
    } catch (error: unknown) {
      console.error("❌ Template Manager - Media upload failed:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("❌ Error response:", error.response.data);
        console.error("❌ Error status:", error.response.status);
      }
      throw error;
    }
  }

  async create(template: TemplateDefinition) {
    // Use businessId (WABA_ID) for template operations, not phoneNumberId
    const url = `${this.baseUrl}/${this.businessId}/message_templates`;

    console.log("🔗 Template Manager - CREATE API URL:", url);
    console.log("🔑 Template Manager - Access Token:", this.accessToken ? `${this.accessToken.substring(0, 20)}...` : "NOT SET");
    console.log("📱 Template Manager - Business ID (WABA):", this.businessId);
    console.log("📝 Template Manager - Template Data:", JSON.stringify(template, null, 2));

    try {
      const { data } = await axios.post(url, template, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      console.log("✅ Template Manager - CREATE API call successful");
      console.log("📋 Template Manager - CREATE Response:", JSON.stringify(data, null, 2));
      return data;
    } catch (error: unknown) {
      console.error("❌ Template Manager - CREATE API call failed:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("❌ Error response:", error.response.data);
        console.error("❌ Error status:", error.response.status);
      }
      throw error;
    }
  }

  async getAll(limit = 50) {
    // Use businessId (WABA_ID) for template operations, not phoneNumberId
    const url = `${this.baseUrl}/${this.businessId}/message_templates?limit=${limit}`;

    console.log("🔗 Template Manager - API URL:", url);
    console.log("🔑 Template Manager - Access Token:", this.accessToken ? `${this.accessToken.substring(0, 20)}...` : "NOT SET");
    console.log("📱 Template Manager - Business ID (WABA):", this.businessId);
    console.log("📱 Template Manager - Phone Number ID:", this.phoneNumberId);

    try {
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      console.log("✅ Template Manager - API call successful");
      return data;
    } catch (error: unknown) {
      console.error("❌ Template Manager - API call failed:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("❌ Error response:", error.response.data);
        console.error("❌ Error status:", error.response.status);
      }
      throw error;
    }
  }

  async get(templateName: string) {
    // Use businessId (WABA_ID) for template operations, not phoneNumberId
    const url = `${this.baseUrl}/${this.businessId}/message_templates?name=${encodeURIComponent(
      templateName,
    )}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return data;
  }

  async delete(templateName: string, language = "en_US") {
    // Use businessId (WABA_ID) for template operations, not phoneNumberId
    const url = `${this.baseUrl}/${this.businessId}/message_templates`;
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
