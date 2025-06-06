const User = require('../models/User');

exports.getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await User.find({ role: 'delivery' })
      .select('-password')
      .lean();

    res.json({
      success: true,
      users: deliveryBoys.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isAvailable: user.isAvailable
      }))
    });
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery boys'
    });
  }
};
