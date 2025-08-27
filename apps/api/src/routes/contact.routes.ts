import { Router } from "express";
import axios from "axios";

const router = Router();
const CONTACT_SERVICE_URL = process.env.CONTACT_SERVICE_URL || "http://localhost:3003";

// Proxy specific contact routes to contact service
router.get("/", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/contacts`, {
      params: req.query,
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

router.get("/:id", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/contacts/${req.params.id}`);
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
    const response = await axios.post(`${CONTACT_SERVICE_URL}/api/v1/contacts`, req.body, {
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
    const response = await axios.put(`${CONTACT_SERVICE_URL}/api/v1/contacts/${req.params.id}`, req.body, {
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
    const response = await axios.delete(`${CONTACT_SERVICE_URL}/api/v1/contacts/${req.params.id}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.post("/bulk-import", async (req, res) => {
  try {
    const response = await axios.post(`${CONTACT_SERVICE_URL}/api/v1/contacts/bulk-import`, req.body, {
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

router.get("/export", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/contacts/export`, {
      params: req.query
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/contacts/search`, {
      params: req.query
    });
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
    const response = await axios.get(`${CONTACT_SERVICE_URL}/api/v1/contacts/stats`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Contact service proxy error:', error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || 'Contact service unavailable'
    });
  }
});

export default router;
