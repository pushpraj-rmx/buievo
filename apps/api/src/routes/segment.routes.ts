import { Router } from "express";
import axios from "axios";

const router = Router();
const CONTACT_SERVICE_URL = process.env.CONTACT_SERVICE_URL || "http://localhost:3003";

// Proxy specific segment routes to contact service
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/segments`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/segments/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const response = await axios.post(`${CONTACT_SERVICE_URL}/api/v1/segments`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const response = await axios.put(`${CONTACT_SERVICE_URL}/api/v1/segments/${req.params.id}`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const response = await axios.delete(`${CONTACT_SERVICE_URL}/api/v1/segments/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/segments/stats`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.post("/:id/contacts", async (req, res) => {
  try {
    const response = await axios.post(`${CONTACT_SERVICE_URL}/api/v1/segments/${req.params.id}/contacts`, req.body, {
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.delete("/:id/contacts", async (req, res) => {
  try {
    const response = await axios.delete(`${CONTACT_SERVICE_URL}/api/v1/segments/${req.params.id}/contacts`, {
      data: req.body,
      headers: { 'Content-Type': 'application/json' }
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

export default router;
