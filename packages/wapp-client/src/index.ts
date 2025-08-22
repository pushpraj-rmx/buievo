import axios, { isAxiosError } from "axios";

export interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
  imageUrl?: string; // Add support for image URL in templates
  documentUrl?: string; // Add support for document URL in templates (PDFs, etc.)
  filename?: string; // Optional filename for documents
}

export interface SendTextMessageArgs {
  to: string;
  text: string;
}

export interface WhatsAppSuccessResponse {
  messaging_product: "whatsapp";
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export const wappClient = {
  async sendTextMessage(
    args: SendTextMessageArgs,
  ): Promise<WhatsAppSuccessResponse> {
    console.log(
      "wappClient.sendTextMessage received args:",
      JSON.stringify(args, null, 2),
    );

    const { to, text } = args;
    const { PHONE_NUMBER_ID, ACCESS_TOKEN } = process.env;
    const apiVersion = process.env.META_API_VERSION || "v21.0";
    const url = `https://graph.facebook.com/${apiVersion}/${PHONE_NUMBER_ID}/messages`;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      throw new Error("WhatsApp environment variables are not set!");
    }

    console.log("🔧 Configuration:");
    console.log("  - API Version:", apiVersion);
    console.log(
      "  - Phone Number ID:",
      PHONE_NUMBER_ID ? `${PHONE_NUMBER_ID.substring(0, 4)}...` : "NOT SET",
    );
    console.log(
      "  - Access Token:",
      ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 10)}...` : "NOT SET",
    );
    console.log("  - API URL:", url);

    const payload = {
      messaging_product: "whatsapp" as const,
      to,
      type: "text" as const,
      text: {
        body: text,
      },
    };

    console.log("Constructed Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post<WhatsAppSuccessResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        `✅ Text message sent successfully to ${to} (Status: ${response.status})`,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        console.error(
          `❌ Failed to send text message to ${to} (Status: ${error.response?.status}):`,
          errorMessage,
        );

        console.error(
          "🔍 Full Meta API Error Response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("🔍 HTTP Status:", error.response?.status);
        console.error("🔍 Error Headers:", error.response?.headers);
        console.error("📤 Sent Payload:", JSON.stringify(payload, null, 2));
      } else {
        console.error("📤 Sent Payload:", JSON.stringify(payload, null, 2));
        console.error(`❌ An unexpected error occurred:`, error);
      }
      throw error;
    }
  },

  async sendTemplateMessage(
    args: SendTemplateMessageArgs,
  ): Promise<WhatsAppSuccessResponse> {
    // --- Log the raw arguments received by the function ---
    console.log(
      "wappClient.sendTemplateMessage received args:",
      JSON.stringify(args, null, 2),
    );

    const {
      to,
      templateName,
      bodyParams = [],
      buttonParams = [],
      imageUrl,
      documentUrl,
      filename,
    } = args;
    const { PHONE_NUMBER_ID, ACCESS_TOKEN } = process.env;
    const apiVersion = process.env.META_API_VERSION || "v21.0";
    const url = `https://graph.facebook.com/${apiVersion}/${PHONE_NUMBER_ID}/messages`;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      throw new Error("WhatsApp environment variables are not set!");
    }

    // Log configuration details for debugging (without exposing sensitive data)
    console.log("🔧 Configuration:");
    console.log("  - API Version:", apiVersion);
    console.log(
      "  - Phone Number ID:",
      PHONE_NUMBER_ID ? `${PHONE_NUMBER_ID.substring(0, 4)}...` : "NOT SET",
    );
    console.log(
      "  - Access Token:",
      ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 10)}...` : "NOT SET",
    );
    console.log("  - API URL:", url);

    const components: any[] = [];

    // Add image component if imageUrl is provided
    if (imageUrl) {
      components.push({
        type: "header",
        parameters: [
          {
            type: "image",
            image: {
              link: imageUrl,
            },
          },
        ],
      });
    }

    // Add document component if documentUrl is provided
    if (documentUrl) {
      components.push({
        type: "header",
        parameters: [
          {
            type: "document",
            document: {
              link: documentUrl,
              ...(filename && { filename }),
            },
          },
        ],
      });
    }

    // Add body parameters
    if (bodyParams.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParams.map((param) => ({
          type: "text",
          text: param,
        })),
      });
    }

    // Add button parameters (for dynamic URLs)
    buttonParams.forEach((param, index) => {
      components.push({
        type: "button",
        sub_type: "url",
        index, // index must match button index in the template
        parameters: [
          {
            type: "text",
            text: param,
          },
        ],
      });
    });

    const payload = {
      messaging_product: "whatsapp" as const,
      to,
      type: "template" as const,
      template: {
        name: templateName,
        language: { code: "en_US" },
        components,
      },
    };

    // --- Log the payload for debugging ---
    console.log("Constructed Payload:", JSON.stringify(payload, null, 2));

    try {
      const response = await axios.post<WhatsAppSuccessResponse>(url, payload, {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      });

      console.log(
        `✅ Message sent successfully to ${to} (Status: ${response.status})`,
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        console.error(
          `❌ Failed to send message to ${to} (Status: ${error.response?.status}):`,
          errorMessage,
        );

        // Log the full Meta API error response for debugging
        console.error(
          "🔍 Full Meta API Error Response:",
          JSON.stringify(error.response?.data, null, 2),
        );
        console.error("🔍 HTTP Status:", error.response?.status);
        console.error("🔍 Error Headers:", error.response?.headers);

        // log the full payload for debugging
        console.error("📤 Sent Payload:", JSON.stringify(payload, null, 2));
      } else {
        // log the full payload for debugging
        console.error("📤 Sent Payload:", JSON.stringify(payload, null, 2));
        console.error(`❌ An unexpected error occurred:`, error);
      }
      throw error;
    }
  },
};
