import "dotenv/config";
import path from "path";
import axios, { AxiosError } from "axios";

// Load environment variables from the project root
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), "../../.env") });

export interface TemplateButton {
  type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "COPY_CODE";
  text?: string;
  url?: string;
  phone_number?: string;
  example?: string[];
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "CAROUSEL";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: unknown;
  buttons?: TemplateButton[];
  cards?: Array<{
    components: Array<{
      type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
      format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
      text?: string;
      example?: unknown;
      buttons?: TemplateButton[];
    }>;
  }>;
}

export interface TemplateDefinition {
  name: string;
  language: string; // e.g., en_US
  category: "MARKETING" | "UTILITY" | "AUTHENTICATION";
  components: TemplateComponent[];
  // Enhanced metadata
  description?: string;
  tags?: string[];
  variables?: string[]; // Extracted variables like {{1}}, {{2}}, etc.
  estimatedApprovalTime?: string; // e.g., "24-48 hours"
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

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
  estimatedApprovalTime: string;
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

  /**
   * Validate a template definition before submission
   */
  validateTemplate(template: TemplateDefinition): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const variables: string[] = [];

    // Extract variables from text
    const extractVariables = (text: string) => {
      const variableRegex = /\{\{(\d+)\}\}/g;
      let match;
      while ((match = variableRegex.exec(text)) !== null) {
        variables.push(match[0]);
      }
    };

    // Validate template name
    if (!template.name.trim()) {
      errors.push("Template name is required");
    } else if (!/^[a-z0-9_]+$/.test(template.name)) {
      errors.push("Template name must contain only lowercase letters, numbers, and underscores");
    }

    // Validate components
    if (!template.components || template.components.length === 0) {
      errors.push("At least one component is required");
    }

    let hasBody = false;
    let hasHeader = false;
    let hasFooter = false;
    let hasButtons = false;

    template.components.forEach((component) => {
      // Check for required body component
      if (component.type === "BODY") {
        hasBody = true;
        if (!component.text || component.text.trim().length === 0) {
          errors.push("Body component must have text content");
        } else {
          extractVariables(component.text);
        }
      }

      // Check for header
      if (component.type === "HEADER") {
        hasHeader = true;
        if (component.text && component.text.length > 60) {
          errors.push("Header text must be 60 characters or less");
        }
        if (component.text) {
          extractVariables(component.text);
        }
      }

      // Check for footer
      if (component.type === "FOOTER") {
        hasFooter = true;
        if (component.text && component.text.length > 60) {
          errors.push("Footer text must be 60 characters or less");
        }
        if (component.text) {
          extractVariables(component.text);
        }
      }

      // Check for buttons
      if (component.type === "BUTTONS") {
        hasButtons = true;
        if (!component.buttons || component.buttons.length === 0) {
          errors.push("Buttons component must have at least one button");
        } else if (component.buttons.length > 3) {
          errors.push("Maximum 3 buttons allowed per template");
        }

        component.buttons?.forEach((button, buttonIndex) => {
          if (!button.text || button.text.trim().length === 0) {
            errors.push(`Button ${buttonIndex + 1} must have text`);
          }
          if (button.text && button.text.length > 25) {
            errors.push(`Button ${buttonIndex + 1} text must be 25 characters or less`);
          }
        });
      }
    });

    if (!hasBody) {
      errors.push("Template must have a BODY component");
    }

    // Estimate approval time based on category and complexity
    let estimatedApprovalTime = "24-48 hours";
    if (template.category === "MARKETING") {
      estimatedApprovalTime = "48-72 hours";
      if (hasButtons) {
        estimatedApprovalTime = "72-96 hours";
      }
    } else if (template.category === "AUTHENTICATION") {
      estimatedApprovalTime = "12-24 hours";
    }

    // Add warnings for best practices
    if (variables.length === 0) {
      warnings.push("Consider adding variables to make your template more dynamic");
    }
    if (!hasHeader && !hasFooter) {
      warnings.push("Consider adding a header or footer for better branding");
    }
    if (hasButtons && template.category === "MARKETING") {
      warnings.push("Marketing templates with buttons may take longer to approve");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      variables: [...new Set(variables)], // Remove duplicates
      estimatedApprovalTime,
    };
  }

  /**
   * Generate a preview of how the template will look
   */
  generatePreview(template: TemplateDefinition, variables: Record<string, string> = {}): string {
    let preview = `📱 Template: ${template.name}\n`;
    preview += `📂 Category: ${template.category}\n`;
    preview += `🌐 Language: ${template.language}\n\n`;

    template.components.forEach((component) => {
      switch (component.type) {
        case "HEADER":
          if (component.text) {
            let headerText = component.text;
            // Replace variables with sample values
            Object.entries(variables).forEach(([key, value]) => {
              headerText = headerText.replace(new RegExp(key, 'g'), value);
            });
            preview += `📋 HEADER: ${headerText}\n\n`;
          }
          break;
        case "BODY":
          if (component.text) {
            let bodyText = component.text;
            // Replace variables with sample values
            Object.entries(variables).forEach(([key, value]) => {
              bodyText = bodyText.replace(new RegExp(key, 'g'), value);
            });
            preview += `💬 BODY: ${bodyText}\n\n`;
          }
          break;
        case "FOOTER":
          if (component.text) {
            let footerText = component.text;
            // Replace variables with sample values
            Object.entries(variables).forEach(([key, value]) => {
              footerText = footerText.replace(new RegExp(key, 'g'), value);
            });
            preview += `📝 FOOTER: ${footerText}\n\n`;
          }
          break;
        case "BUTTONS":
          if (component.buttons) {
            preview += `🔘 BUTTONS:\n`;
            component.buttons.forEach((button, index) => {
              preview += `  ${index + 1}. [${button.type}] ${button.text}\n`;
            });
            preview += `\n`;
          }
          break;
      }
    });

    return preview;
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
