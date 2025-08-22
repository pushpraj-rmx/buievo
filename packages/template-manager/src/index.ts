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

export interface CarouselCard {
  components: Array<{
    type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
    format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
    text?: string;
    example?: unknown;
    buttons?: TemplateButton[];
  }>;
}

export interface TemplateComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "CAROUSEL";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT";
  text?: string;
  example?: unknown;
  buttons?: TemplateButton[];
  cards?: CarouselCard[];
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

export interface MediaAsset {
  id: string;
  handle: string;
  url: string;
  type: "image" | "video";
  mimeType: string;
  size: number;
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
    let hasCarousel = false;

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

          // Validate URL buttons
          if (button.type === "URL") {
            if (!button.url || button.url.trim().length === 0) {
              errors.push(`URL button ${buttonIndex + 1} must have a URL`);
            }
            if (button.url && button.url.length > 2000) {
              errors.push(`URL button ${buttonIndex + 1} URL must be 2000 characters or less`);
            }
            if (button.url) {
              extractVariables(button.url);
            }
          }

          // Validate phone number buttons
          if (button.type === "PHONE_NUMBER") {
            if (!button.phone_number || button.phone_number.trim().length === 0) {
              errors.push(`Phone number button ${buttonIndex + 1} must have a phone number`);
            }
            if (button.phone_number && button.phone_number.length > 20) {
              errors.push(`Phone number button ${buttonIndex + 1} must be 20 characters or less`);
            }
          }
        });
      }

      // Check for carousel
      if (component.type === "CAROUSEL") {
        hasCarousel = true;
        if (!component.cards || component.cards.length === 0) {
          errors.push("Carousel component must have at least one card");
        } else if (component.cards.length < 2) {
          errors.push("Carousel must have at least 2 cards");
        } else if (component.cards.length > 10) {
          errors.push("Carousel cannot have more than 10 cards");
        }

        // Validate each card
        component.cards?.forEach((card, cardIndex) => {
          if (!card.components || card.components.length === 0) {
            errors.push(`Card ${cardIndex + 1} must have at least one component`);
          }

          let cardHasHeader = false;
          let cardHasButtons = false;

                     card.components.forEach((cardComponent) => {
            // Check for header (required for carousel cards)
            if (cardComponent.type === "HEADER") {
              cardHasHeader = true;
              if (!cardComponent.format || !["IMAGE", "VIDEO"].includes(cardComponent.format)) {
                errors.push(`Card ${cardIndex + 1} header must have format "IMAGE" or "VIDEO"`);
              }
            }

            // Check for buttons
            if (cardComponent.type === "BUTTONS") {
              cardHasButtons = true;
              if (!cardComponent.buttons || cardComponent.buttons.length === 0) {
                errors.push(`Card ${cardIndex + 1} must have at least one button`);
              } else if (cardComponent.buttons.length > 2) {
                errors.push(`Card ${cardIndex + 1} cannot have more than 2 buttons`);
              }

              cardComponent.buttons?.forEach((button, buttonIndex) => {
                if (!button.text || button.text.trim().length === 0) {
                  errors.push(`Card ${cardIndex + 1} button ${buttonIndex + 1} must have text`);
                }
                if (button.text && button.text.length > 25) {
                  errors.push(`Card ${cardIndex + 1} button ${buttonIndex + 1} text must be 25 characters or less`);
                }

                // Validate URL buttons
                if (button.type === "URL") {
                  if (!button.url || button.url.trim().length === 0) {
                    errors.push(`Card ${cardIndex + 1} URL button ${buttonIndex + 1} must have a URL`);
                  }
                  if (button.url && button.url.length > 2000) {
                    errors.push(`Card ${cardIndex + 1} URL button ${buttonIndex + 1} URL must be 2000 characters or less`);
                  }
                  if (button.url) {
                    extractVariables(button.url);
                  }
                }

                // Validate phone number buttons
                if (button.type === "PHONE_NUMBER") {
                  if (!button.phone_number || button.phone_number.trim().length === 0) {
                    errors.push(`Card ${cardIndex + 1} phone number button ${buttonIndex + 1} must have a phone number`);
                  }
                  if (button.phone_number && button.phone_number.length > 20) {
                    errors.push(`Card ${cardIndex + 1} phone number button ${buttonIndex + 1} must be 20 characters or less`);
                  }
                }
              });
            }
          });

          if (!cardHasHeader) {
            errors.push(`Card ${cardIndex + 1} must have a header component`);
          }
          if (!cardHasButtons) {
            errors.push(`Card ${cardIndex + 1} must have a buttons component`);
          }
        });

        // Check for consistent card structure
        if (component.cards && component.cards.length > 1) {
          const firstCard = component.cards[0];
          if (firstCard) {
            component.cards.forEach((card, cardIndex) => {
              if (cardIndex === 0) return;

              // Check if all cards have the same component types
              const firstCardTypes = firstCard.components.map(c => c.type).sort();
              const currentCardTypes = card.components.map(c => c.type).sort();

              if (JSON.stringify(firstCardTypes) !== JSON.stringify(currentCardTypes)) {
                errors.push(`All carousel cards must have the same component structure. Card ${cardIndex + 1} differs from card 1`);
              }
            });
          }
        }
      }
    });

    if (!hasBody) {
      errors.push("Template must have a BODY component");
    }

    // Carousel-specific validation
    if (hasCarousel) {
      if (template.category !== "MARKETING") {
        errors.push("Carousel templates must be in the MARKETING category");
      }
      if (hasButtons) {
        errors.push("Carousel templates cannot have standalone buttons (buttons must be in cards)");
      }
    }

    // Estimate approval time based on category and complexity
    let estimatedApprovalTime = "24-48 hours";
    if (template.category === "MARKETING") {
      estimatedApprovalTime = "48-72 hours";
      if (hasButtons || hasCarousel) {
        estimatedApprovalTime = "72-96 hours";
      }
    } else if (template.category === "AUTHENTICATION") {
      estimatedApprovalTime = "12-24 hours";
    }

    // Add warnings for best practices
    if (variables.length === 0) {
      warnings.push("Consider adding variables to make your template more dynamic");
    }
    if (!hasHeader && !hasFooter && !hasCarousel) {
      warnings.push("Consider adding a header or footer for better branding");
    }
    if (hasButtons && template.category === "MARKETING") {
      warnings.push("Marketing templates with buttons may take longer to approve");
    }
    if (hasCarousel) {
      warnings.push("Carousel templates require media assets and may take longer to approve");
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
              preview += `  ${index + 1}. [${button.type}] ${button.text}`;
              if (button.type === "URL" && button.url) {
                preview += ` → ${button.url}`;
              }
              if (button.type === "PHONE_NUMBER" && button.phone_number) {
                preview += ` → ${button.phone_number}`;
              }
              preview += `\n`;
            });
            preview += `\n`;
          }
          break;
        case "CAROUSEL":
          if (component.cards) {
            preview += `🎠 CAROUSEL (${component.cards.length} cards):\n`;
            component.cards.forEach((card, cardIndex) => {
              preview += `  📦 Card ${cardIndex + 1}:\n`;
              card.components.forEach((cardComponent) => {
                switch (cardComponent.type) {
                  case "HEADER":
                    preview += `    📷 Header: ${cardComponent.format || "IMAGE"}\n`;
                    break;
                  case "BODY":
                    if (cardComponent.text) {
                      let cardBodyText = cardComponent.text;
                      Object.entries(variables).forEach(([key, value]) => {
                        cardBodyText = cardBodyText.replace(new RegExp(key, 'g'), value);
                      });
                      preview += `    💬 Body: ${cardBodyText}\n`;
                    }
                    break;
                  case "FOOTER":
                    if (cardComponent.text) {
                      let cardFooterText = cardComponent.text;
                      Object.entries(variables).forEach(([key, value]) => {
                        cardFooterText = cardFooterText.replace(new RegExp(key, 'g'), value);
                      });
                      preview += `    📝 Footer: ${cardFooterText}\n`;
                    }
                    break;
                  case "BUTTONS":
                    if (cardComponent.buttons) {
                      preview += `    🔘 Buttons:\n`;
                      cardComponent.buttons.forEach((button, index) => {
                        preview += `      ${index + 1}. [${button.type}] ${button.text}`;
                        if (button.type === "URL" && button.url) {
                          preview += ` → ${button.url}`;
                        }
                        if (button.type === "PHONE_NUMBER" && button.phone_number) {
                          preview += ` → ${button.phone_number}`;
                        }
                        preview += `\n`;
                      });
                    }
                    break;
                }
              });
              preview += `\n`;
            });
          }
          break;
      }
    });

    return preview;
  }

  /**
   * Upload media for carousel templates
   */
  async uploadMedia(fileUrl: string, type: "image" | "video" = "image"): Promise<MediaAsset> {
    console.log("📤 Template Manager - Starting media upload for carousel...");
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
        filename: `carousel_${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`,
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

      return {
        id: uploadResponse.data.id,
        handle: uploadResponse.data.handle,
        url: fileUrl,
        type,
        mimeType: type === 'image' ? 'image/jpeg' : 'video/mp4',
        size: buffer.length,
      };
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
