// Webhook status checker
import { webhookLogger } from "./logger";

export interface WebhookStatus {
  isHealthy: boolean;
  lastWebhookReceived?: Date;
  totalWebhooksReceived: number;
  lastError?: string;
  verificationStatus: "verified" | "unverified" | "unknown";
}

class WebhookStatusMonitor {
  private status: WebhookStatus = {
    isHealthy: true,
    totalWebhooksReceived: 0,
    verificationStatus: "unknown",
  };

  private lastWebhookTime: Date | null = null;
  private errorCount = 0;
  private maxErrors = 5;

  recordWebhookReceived() {
    this.lastWebhookTime = new Date();
    this.status.lastWebhookReceived = this.lastWebhookTime;
    this.status.totalWebhooksReceived++;
    this.status.isHealthy = true;
    this.errorCount = 0;

    webhookLogger.info("📨 Webhook received", {
      totalReceived: this.status.totalWebhooksReceived,
      lastReceived: this.lastWebhookTime.toISOString(),
    });
  }

  recordWebhookError(error: string) {
    this.errorCount++;
    this.status.lastError = error;

    if (this.errorCount >= this.maxErrors) {
      this.status.isHealthy = false;
    }

    webhookLogger.error("❌ Webhook error", {
      error,
      errorCount: this.errorCount,
      isHealthy: this.status.isHealthy,
    });
  }

  setVerificationStatus(status: "verified" | "unverified") {
    this.status.verificationStatus = status;
    webhookLogger.info("🔐 Webhook verification status updated", { status });
  }

  getStatus(): WebhookStatus {
    return { ...this.status };
  }

  isWebhookHealthy(): boolean {
    // Consider webhook unhealthy if no webhooks received in last 24 hours
    if (this.lastWebhookTime) {
      const hoursSinceLastWebhook =
        (Date.now() - this.lastWebhookTime.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastWebhook > 24) {
        this.status.isHealthy = false;
      }
    }

    return this.status.isHealthy;
  }

  getHealthReport(): string {
    const status = this.getStatus();
    const isHealthy = this.isWebhookHealthy();

    return `
🔍 Webhook Health Report
=======================
Status: ${isHealthy ? "✅ Healthy" : "❌ Unhealthy"}
Verification: ${status.verificationStatus === "verified" ? "✅ Verified" : "❌ Not Verified"}
Total Webhooks: ${status.totalWebhooksReceived}
Last Webhook: ${status.lastWebhookReceived ? status.lastWebhookReceived.toISOString() : "Never"}
Last Error: ${status.lastError || "None"}
    `.trim();
  }
}

export const webhookMonitor = new WebhookStatusMonitor();
