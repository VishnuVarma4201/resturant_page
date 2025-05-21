// server/models/DeliveryBoy.js
const mongoose = require('mongoose');

const deliveryBoySchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  isAvailable: { type: Boolean, default: true },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  rating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },
  earnings: {
    monthly: { type: Number, default: 0 },
    tips: { type: Number, default: 0 }
  },
  deliveries: [{
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, min: 1, max: 5 },
    tip: { type: Number, default: 0 },
    earnings: { type: Number, required: true }, // Delivery charge + tip
    comment: String,
    deliveredAt: { type: Date }
  }],
  earnings: {
    total: { type: Number, default: 0 }, // Total earnings including tips
    tips: { type: Number, default: 0 }, // Total tips earned
    deliveryCharges: { type: Number, default: 0 } // Total delivery charges earned
  },
  ratings: {
    average: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  performance: {
    totalDeliveries: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 }, // Percentage of successful deliveries
    onTimeRate: { type: Number, default: 0 }, // Percentage of on-time deliveries
    averageDeliveryTime: { type: Number, default: 0 }, // in minutes
    lastDeliveries: [{
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
      deliveryTime: Number, // in minutes
      distance: Number,     // in kilometers
      rating: Number
    }]
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]  // [longitude, latitude]
    },
    lastUpdated: { type: Date }
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    nextAvailableTime: { type: Date }
  }
}, { timestamps: true });

// Add geospatial index for location-based queries
deliveryBoySchema.index({ 'currentLocation': '2dsphere' });

// Remove password from JSON responses
deliveryBoySchema.methods.toJSON = function() {
  const deliveryBoy = this.toObject();
  delete deliveryBoy.password;
  return deliveryBoy;
};

// Update statistics when a delivery is completed
deliveryBoySchema.methods.updateStats = async function() {
  try {
    // First populate required order data
    await this.populate('deliveries.order');
    
    if (this.deliveries.length > 0) {
      // Calculate ratings
      const ratings = this.deliveries.filter(d => d.rating).map(d => d.rating);
      this.ratings.count = ratings.length;
      this.ratings.total = ratings.reduce((a, b) => a + b, 0);
      this.ratings.average = this.ratings.count > 0 ? this.ratings.total / this.ratings.count : 0;

      // Calculate earnings
      let totalTips = 0;
      let totalDeliveryCharges = 0;

      this.deliveries.forEach(del => {
        totalTips += del.tip || 0;
        totalDeliveryCharges += del.earnings || 0;
      });

      this.earnings.tips = totalTips;
      this.earnings.deliveryCharges = totalDeliveryCharges;
      this.earnings.total = totalTips + totalDeliveryCharges;

      // Calculate performance
      this.performance.totalDeliveries = this.deliveries.length;
      let onTimeDeliveries = 0;
      let totalDeliveryTime = 0;

      this.deliveries.forEach(del => {
        if (del.deliveredAt && del.order?.createdAt) {
          const deliveryTime = new Date(del.deliveredAt).getTime() - new Date(del.order.createdAt).getTime();
          if (deliveryTime <= 45 * 60 * 1000) { // 45 minutes
            onTimeDeliveries++;
          }
          totalDeliveryTime += deliveryTime / (60 * 1000); // Convert ms to minutes
        }
      });

      this.performance.onTimeRate = this.performance.totalDeliveries > 0 
        ? (onTimeDeliveries / this.performance.totalDeliveries) * 100 
        : 0;
      this.performance.completionRate = 100; // Can be adjusted if you track cancelled/failed deliveries
      this.performance.averageDeliveryTime = this.performance.totalDeliveries > 0 
        ? totalDeliveryTime / this.performance.totalDeliveries 
        : 0;

      // Update availability status
      const Order = mongoose.model('Order');
      const hasActiveDelivery = await Order.exists({
        assignedTo: this._id,
        status: { $in: ['assigned', 'delivering'] }
      });
      this.status = hasActiveDelivery ? 'busy' : 'available';

      // Mark the document as modified
      this.markModified('earnings');
      this.markModified('ratings');
      this.markModified('performance');
    }
  } catch (err) {
    console.error('Error updating delivery boy stats:', err);
    throw err;
  }
};

// Update location
deliveryBoySchema.methods.updateLocation = async function(longitude, latitude) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [longitude, latitude],
    lastUpdated: new Date()
  };
  await this.save();
};

// Calculate distance from coordinates
deliveryBoySchema.methods.getDistanceFrom = function(longitude, latitude) {
  // Earth's radius in kilometers
  const R = 6371;
  
  const [lon1, lat1] = this.currentLocation.coordinates;
  const [lon2, lat2] = [longitude, latitude];
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Find nearest delivery boys
deliveryBoySchema.statics.findNearest = async function(longitude, latitude, maxDistance = 10) {
  return this.find({
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    'availability.isAvailable': true
  }).select('-password');
};

const DeliveryBoy = mongoose.model('DeliveryBoy', deliveryBoySchema);

module.exports = DeliveryBoy;