const axios = require('axios');
const OpenAI = require('openai');

// Initialize OpenAI configuration
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Initialize menu context
let menuContext = null;

const chatbotController = {
    // Update menu context
    updateMenuContext: async (menu) => {
        menuContext = menu;
    },

    // Handle customer queries
    handleQuery: async (req, res) => {
        const { message, userId, orderContext } = req.body;

        try {
            // Prepare context for the AI
            let context = "You are a helpful restaurant assistant. ";
            if (menuContext) {
                context += `Our menu includes: ${JSON.stringify(menuContext)}. `;
            }
            if (orderContext) {
                context += `Regarding order #${orderContext.orderId}: ${JSON.stringify(orderContext)}. `;
            }            // Generate response using OpenAI
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: context },
                    { role: "user", content: message }
                ],
                temperature: 0.7,
                max_tokens: 200
            });

            const botReply = completion.choices[0].message.content;

            // Log interaction for analysis
            console.log('Chat Interaction:', {
                userId,
                query: message,
                response: botReply,
                timestamp: new Date()
            });

            res.json({
                reply: botReply,
                context: {
                    hasMenu: !!menuContext,
                    hasOrderContext: !!orderContext
                }
            });

        } catch (error) {
            console.error('Chatbot Error:', error);
            
            // Fallback to Hugging Face if OpenAI fails
            try {
                const response = await axios.post(
                    "https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1",
                    {
                        inputs: `<s>[INST] ${message} [/INST]`
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
                            "Content-Type": "application/json"
                        },
                    }
                );

                const fallbackReply = response.data?.[0]?.generated_text
                    ?.replace(`<s>[INST] ${message} [/INST]`, "")
                    .trim() || "I apologize, but I'm having trouble understanding. Please try rephrasing your question.";

                res.json({ reply: fallbackReply });

            } catch (fallbackError) {
                console.error('Fallback Chatbot Error:', fallbackError);
                res.status(500).json({ 
                    error: "I'm currently unable to process your request. Please try again later.",
                    technicalDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
                });
            }
        }
    },

    // Handle order-specific queries
    handleOrderQuery: async (req, res) => {
        const { message, orderId } = req.body;

        try {
            // Fetch order details
            const order = await Order.findById(orderId)
                .populate('items.menuItem')
                .populate('assignedTo', 'name phone')
                .populate('user', 'name');

            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }

            // Prepare order-specific context
            const orderContext = {
                orderId: order._id,
                status: order.status,
                items: order.items.map(item => ({
                    name: item.menuItem.name,
                    quantity: item.quantity
                })),
                estimatedDelivery: order.estimatedDeliveryTime,
                deliveryPerson: order.assignedTo ? {
                    name: order.assignedTo.name,
                    phone: order.assignedTo.phone
                } : null
            };

            // Forward to general query handler with order context
            req.body.orderContext = orderContext;
            return this.handleQuery(req, res);

        } catch (err) {
            console.error('Order Query Error:', err);
            res.status(500).json({ message: 'Failed to process order-specific query' });
        }
    }
};

module.exports = chatbotController;
