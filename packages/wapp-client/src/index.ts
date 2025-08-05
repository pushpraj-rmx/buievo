import axios, { isAxiosError } from "axios";

export interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  bodyParams?: string[];
  buttonParams?: string[];
}

export interface WhatsAppSuccessResponse {
  messaging_product: "whatsapp";
  contacts: { input: string; wa_id: string }[];
  messages: { id: string }[];
}

export const wappClient = {
  async sendTemplateMessage(
    args: SendTemplateMessageArgs
  ): Promise<WhatsAppSuccessResponse> {
    // --- Log the raw arguments received by the function ---
    console.log(
      "wappClient.sendTemplateMessage received args:",
      JSON.stringify(args, null, 2)
    );

    const { to, templateName, bodyParams = [], buttonParams = [] } = args;
    const { PHONE_NUMBER_ID, ACCESS_TOKEN } = process.env;
    const apiVersion = process.env.META_API_VERSION || "v20.0";
    const url = `https://graph.facebook.com/${apiVersion}/${PHONE_NUMBER_ID}/messages`;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      throw new Error("WhatsApp environment variables are not set!");
    }

    const components: any[] = [];

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
        `✅ Message sent successfully to ${to} (Status: ${response.status})`
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.error?.message || error.message;
        console.error(
          `❌ Failed to send message to ${to} (Status: ${error.response?.status}):`,
          errorMessage
        );
        // log the full payload for debugging
        console.error("Payload:", JSON.stringify(payload, null, 2));
      } else {
        // log the full payload for debugging
        console.error("Payload:", JSON.stringify(payload, null, 2));
        console.error(`❌ An unexpected error occurred:`, error);
      }
      throw error;
    }
  },
};
