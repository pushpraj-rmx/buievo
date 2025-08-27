import { Request, Response } from "express";
import axios from "axios";
import { z } from "zod";

// WABA Subscription Management Controller
// Handles subscribing/unsubscribing apps to WhatsApp Business Account webhooks

const wabaSubscriptionSchema = z.object({
  wabaId: z.string().min(1, "WABA ID is required"),
});

export const subscribeAppToWABA = async (req: Request, res: Response) => {
  try {
    const { wabaId } = wabaSubscriptionSchema.parse(req.body);
    const accessToken = process.env.ACCESS_TOKEN;
    const apiVersion = process.env.META_API_VERSION || "v21.0";

    if (!accessToken) {
      return res.status(500).json({ 
        error: "ACCESS_TOKEN not configured" 
      });
    }

    const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/subscribed_apps`;
    
    const response = await axios.post(url, {}, {
      headers: { 
        Authorization: `Bearer ${accessToken}` 
      }
    });

    res.json({ 
      success: true, 
      message: "App subscribed to WABA webhooks successfully",
      data: response.data 
    });

  } catch (error) {
    console.error("WABA subscription error:", error);
    res.status(500).json({ 
      error: "Failed to subscribe app to WABA",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const getSubscribedApps = async (req: Request, res: Response) => {
  try {
    const { wabaId } = wabaSubscriptionSchema.parse(req.params);
    const accessToken = process.env.ACCESS_TOKEN;
    const apiVersion = process.env.META_API_VERSION || "v21.0";

    if (!accessToken) {
      return res.status(500).json({ 
        error: "ACCESS_TOKEN not configured" 
      });
    }

    const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/subscribed_apps`;
    
    const response = await axios.get(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}` 
      }
    });

    res.json({ 
      success: true, 
      data: response.data 
    });

  } catch (error) {
    console.error("Get subscribed apps error:", error);
    res.status(500).json({ 
      error: "Failed to get subscribed apps",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};

export const unsubscribeAppFromWABA = async (req: Request, res: Response) => {
  try {
    const { wabaId } = wabaSubscriptionSchema.parse(req.params);
    const accessToken = process.env.ACCESS_TOKEN;
    const apiVersion = process.env.META_API_VERSION || "v21.0";

    if (!accessToken) {
      return res.status(500).json({ 
        error: "ACCESS_TOKEN not configured" 
      });
    }

    const url = `https://graph.facebook.com/${apiVersion}/${wabaId}/subscribed_apps`;
    
    const response = await axios.delete(url, {
      headers: { 
        Authorization: `Bearer ${accessToken}` 
      }
    });

    res.json({ 
      success: true, 
      message: "App unsubscribed from WABA webhooks successfully",
      data: response.data 
    });

  } catch (error) {
    console.error("WABA unsubscription error:", error);
    res.status(500).json({ 
      error: "Failed to unsubscribe app from WABA",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
};
