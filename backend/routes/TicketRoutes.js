const express = require("express");
const router = express.Router();
const {
  upload,
  createTicket,
  getAllTickets,
  getTicketById,
  deleteTicket,
  getUserTickets,
  updateTicketStatus
} = require("../services/TicketController");
const { isAuthorized } = require("../middleware/auth.middleware.js");

// Create a ticket with file upload support
router.post("/", upload.array("attachments", 5), isAuthorized, createTicket);

// Fetch all tickets (Admin only)
router.get("/", getAllTickets);

// Fetch logged-in user's tickets (Now protected with authMiddleware)
router.get("/user", isAuthorized, getUserTickets);

// Fetch a ticket by ID
router.get("/:id", getTicketById);

// Update ticket status
router.put("/:id/status", isAuthorized, updateTicketStatus);

// Delete a ticket by ID
router.delete("/:id", deleteTicket);

module.exports = router;