const Payment = require('../models/Payment');

const createPayment = async (req, res) => {
  const { orderId, amount, method, transactionId } = req.body;
  try {
    const payment = new Payment({
      orderId,
      userId: req.user._id,
      amount,
      method,
      transactionId,
      status: 'completed',
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Payment failed' });
  }
};

const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id }).populate('orderId');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('orderId')
      .populate('userId', 'name email');
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch payments' });
  }
};

module.exports = {
  createPayment,
  getUserPayments,
  getAllPayments
};