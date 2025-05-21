const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin', 'delivery'], default: 'user' },
    phone: { type: String },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }],
    points: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);