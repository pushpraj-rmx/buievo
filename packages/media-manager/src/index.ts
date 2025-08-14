import axios from "axios";
import FormData from "form-data";

export type MediaType = "image" | "video" | "audio" | "document";

export interface UploadMediaParams {
  type: MediaType;
  fileName: string;
  mimeType: string;
  // Accept raw bytes or a readable stream from Node.js
  data: Buffer | NodeJS.ReadableStream;
}

export interface MediaInfo {
  id: string;
  url?: string;
  sha256?: string;
  mimeType: string;
  fileName?: string;
  status?: "UPLOADED" | "PENDING" | "FAILED";
}

export interface MediaManagerOptions {
  baseUrl: string; // e.g., https://graph.facebook.com/v20.0
  accessToken: string;
  phoneNumberId: string;
}

export class MediaManager {
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly phoneNumberId: string;

  constructor(options: MediaManagerOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.accessToken = options.accessToken;
    this.phoneNumberId = options.phoneNumberId;
  }

  async upload(params: UploadMediaParams): Promise<MediaInfo> {
    const form = new FormData();
    form.append("file", params.data as unknown as Blob, params.fileName);
    form.append("type", params.mimeType);
    form.append("messaging_product", "whatsapp");

    const url = `${this.baseUrl}/${this.phoneNumberId}/media`;
    const { data } = await axios.post(url, form, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...form.getHeaders(),
      },
    });

    return { id: data.id, mimeType: params.mimeType, fileName: params.fileName, status: "UPLOADED" };
  }

  async get(mediaId: string): Promise<MediaInfo> {
    const url = `${this.baseUrl}/${mediaId}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { id: data.id, url: data.url, mimeType: data.mime_type, sha256: data.sha256 };
  }

  async delete(mediaId: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${mediaId}`;
    const { data } = await axios.delete(url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    return { success: data.success === true };
  }
}
