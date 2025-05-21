const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { authenticateUser, authorizeRoles } = require("../middleware/auth");

// General queries
router.post("/query", authenticateUser, chatbotController.handleQuery);

// Order-specific queries
router.post("/order/:orderId/query", authenticateUser, chatbotController.handleOrderQuery);

// Update menu context (admin only)
router.post("/update-context", 
  authenticateUser, 
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      await chatbotController.updateMenuContext(req.body.menu);
      res.json({ message: 'Chatbot context updated successfully' });
    } catch (error) {
      console.error('Context Update Error:', error);
      res.status(500).json({ message: 'Failed to update chatbot context' });
    }
  }
);

module.exports = router;
