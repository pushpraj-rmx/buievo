import axios, { isAxiosError } from "axios";

export interface SendTemplateMessageArgs {
  to: string;
  templateName: string;
  bodyParams?: string[];
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
    const { to, templateName, bodyParams = [] } = args;
    const { PHONE_NUMBER_ID, ACCESS_TOKEN } = process.env;
    const apiVersion = process.env.META_API_VERSION || "v20.0"; // Using v20 as a fallback
    const url = `https://graph.facebook.com/${apiVersion}/${PHONE_NUMBER_ID}/messages`;

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      throw new Error("WhatsApp environment variables are not set!");
    }

    const payload = {
      messaging_product: "whatsapp" as const,
      to: to,
      type: "template" as const,
      template: {
        name: templateName,
        language: { code: "en_US" },
        components: [
          {
            type: "body" as const,
            parameters: bodyParams.map((param) => ({
              type: "text" as const,
              text: param,
            })),
          },
        ],
      },
    };

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
      } else {
        console.error(`❌ An unexpected error occurred:`, error);
      }
      throw error;
    }
  },
};
