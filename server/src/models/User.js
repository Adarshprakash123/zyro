const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['customer', 'trainer', 'admin'], required: true },
    societyZone: { type: String, required: true },
    location: { type: locationSchema, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
