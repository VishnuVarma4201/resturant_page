const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Reservation = require('../models/Reservation');

// Get admin dashboard statistics
router.get('/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's stats
    const todayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Get yesterday's stats for comparison
    const yesterdayStats = await Order.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: yesterday,
            $lt: today
          },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Get monthly stats
    const monthlyStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thisMonth },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 }
        }
      }
    ]);

    // Get today's reservations
    const todayReservations = await Reservation.countDocuments({
      date: { $gte: today }
    });

    // Calculate percentage changes
    const todayIncome = todayStats[0]?.totalIncome || 0;
    const yesterdayIncome = yesterdayStats[0]?.totalIncome || 0;
    const revenueChange = yesterdayIncome ? 
      ((todayIncome - yesterdayIncome) / yesterdayIncome) * 100 : 0;

    const todayOrders = todayStats[0]?.orderCount || 0;
    const yesterdayOrders = yesterdayStats[0]?.orderCount || 0;
    const orderChange = yesterdayOrders ? 
      ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;

    res.json({
      todayIncome,
      monthlyIncome: monthlyStats[0]?.totalIncome || 0,
      todayOrders,
      monthlyOrders: monthlyStats[0]?.orderCount || 0,
      todayReservations,
      monthlyReservations: await Reservation.countDocuments({
        date: { $gte: thisMonth }
      }),
      revenueChange: parseFloat(revenueChange.toFixed(2)),
      orderChange: parseFloat(orderChange.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

// Get revenue chart data
router.get('/revenue-chart', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const revenueData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    const formattedData = revenueData.map(item => ({
      date: item._id,
      revenue: parseFloat(item.revenue.toFixed(2))
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    res.status(500).json({ message: 'Error fetching revenue data' });
  }
});

// Get filtered orders list
router.get('/orders', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { filter, sort } = req.query;
    let query = {};
    let sortOption = {};

    // Apply filters
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query.createdAt = { $gte: today };
        break;
      case 'week':
        const week = new Date();
        week.setDate(week.getDate() - 7);
        query.createdAt = { $gte: week };
        break;
      case 'month':
        const month = new Date();
        month.setMonth(month.getMonth() - 1);
        query.createdAt = { $gte: month };
        break;
    }

    // Apply sorting
    switch (sort) {
      case 'date':
        sortOption.createdAt = -1;
        break;
      case 'status':
        sortOption.status = 1;
        break;
      case 'amount':
        sortOption.totalAmount = -1;
        break;
      default:
        sortOption.createdAt = -1;
    }

    const orders = await Order.find(query)
      .sort(sortOption)
      .populate('user', 'name email')
      .limit(100);

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

module.exports = router;
