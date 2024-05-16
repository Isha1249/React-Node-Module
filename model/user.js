const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    default: '',
    required: true
  },
  lastName: {
    type: String,
    default: '',
    required: true
  },
  otp: {
    type: String, 
    default: null 
  }, 
  otpExpiration: {
    type: Date,
  },
  resetToken: {
    type: String, 
    default: null 
  }, 
  resetTokenExpiration: {
    type: Date,
  },
  phone:{
    type:String,
    minlength: 10,
    maxlength: 12,
    unique: true,
    required: true
  },
  bio:{
    type:String
  },
  photo:{
    type:String,
    default: null,
    set: function (value) {
      return value || null;
    }
  },
  token:{
    type:String,
  },
  refreshToken:{
    type:String,
  },
  role: {
    type: String,
    enum: ['customer', 'vendor'], 
    default: 'customer', 
  },
  isVendor: {
    type: Boolean,
    default: false, 
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date, 
    default: null, 
  },
},
{ timestamps: true
});





const User = mongoose.model('User', userSchema);

module.exports = { User};
