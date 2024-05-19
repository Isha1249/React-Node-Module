const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Vendor } = require('../model/vendor');
const emailService = require('../services/emailService');
const { vendorSignupSchema,verifyOTPSchema,loginSchema,editVendorProfileSchema} = require('../validations/validation');
const crypto = require('crypto');
const signup= async (req, res) => {
    try {
      const { error } = vendorSignupSchema.validate(req.body); 
      if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
      }
      let { name,email, password,phone,address,description} = req.body;
      email=email.toLowerCase();
      const existingPhone = await Vendor.findOne({ phone:phone });
      if (existingPhone) {
        return res.status(400).json({ status:false,message: 'Contact Number already exists' });
      }
      const existingVendor = await Vendor.findOne({ email:email });
      if (existingVendor) {
        return res.status(400).json({ status:false,message: 'Email already exists' });
      }
      let photo = '';
      if (req.file) {
        photo = req.file.filename;
      }
      const otp = Math.floor(100000 + Math.random() * 900000); 
      sendOTP(email, otp); 
      const vendor = new Vendor({
        email,
        password: await bcrypt.hash(password, 10),
        name,
        phone,address,
        description,
        photo,
        otp,
        otpExpiration: new Date(Date.now() + 10 * 60 * 1000) 
      });
  
      await vendor.save();
  
      res.status(200).json({ status:true,message: 'Registeration successfully. Please verify your email using the OTP sent to your email.',vendor });
    } catch (error) {
      console.error(error);
      res.status(500).json({ status:false,error: 'Server error' });
    }
};
function sendOTP(email, otp) {
    const mailOptions = {
        from:`"Test Demo" <${process.env.GMAIL_EMAIL}>`,
        to:email,
        subject: 'Email Verification',
        text: `Your OTP for email verification is: ${otp}`,
        html: `<p>Your OTP for email verification is: <b>${otp}</b>.Please note that this OTP will expire in 10 minutes.</p>`
      };
      emailService.sendMail(mailOptions);
}
// Verify OTP route
const verifyOTP=async (req, res) => {
  try {
    const { error } = verifyOTPSchema.validate(req.body); 
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }
    let { email, otp } = req.body;
    email=email.toLowerCase();
    const vendor = await Vendor.findOne({ email:email });
    if(!vendor ){
        return res.status(400).json({ status:false,message: 'Account Not found' });
    }
    if (vendor.otp !== otp) {
      return res.status(400).json({ status:false,message: 'Invalid OTP' });
    }
    if (vendor.otpExpiration < new Date()) {
        return res.status(400).json({ status:false,message: 'OTP expired' });
    }
    vendor.isVerified = true;
    vendor.otp = null;
    vendor.otpExpiration = null;
    await vendor.save();
    res.status(200).json({ status:true,message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
const login = async (req, res) => {
    try{
        const { error } = loginSchema.validate(req.body); 
        if (error) {
          return res.status(400).json({ status: false, message: error.details[0].message });
        }
        let { email, password } = req.body;
        email=email.toLowerCase();
        const vendor = await Vendor.findOne({ email:email });
        if (!vendor) {
          return res.status(401).json({status:false, message: "Account not found." });
        }
        const passwordMatch = await bcrypt.compare(password, vendor.password);
        if (!passwordMatch) {
          return res.status(401).json({status:false, message: "Incorrect password. Please try again or reset your password" });
        }
        if (!vendor.isVerified) {
          return res.status(401).json({ status: false, message: "You are not verified.Please check you email for verification." });
        }
        const token = generateToken(vendor);
        const refreshToken = generateRefreshToken(vendor);
        vendor.token = token;
        vendor.refreshToken = refreshToken;
        const photoURL = process.env.BACKEND_BASE_URL + '/uploads/' + vendor.photo;
        res.status(200).json({
          status:true,
          message: "Login successful!",
          vendor: {
            ...vendor.toObject(), 
            photoURL,
          },
        });
    
        await vendor.save();
      } catch (error) {
        res.status(500).json({
          status:false,
          message: error.message || "Some error occurred while logging in."
        });
      }
};
function generateToken(vendor) {
        const payload = {
          vendorId: vendor._id,
          email: vendor.email
        };
        const secretKey = process.env.JWT_SECRET; 
        const options = {
          expiresIn: '8hrs'
        };
        return jwt.sign(payload, secretKey, options);
}
function generateRefreshToken(vendor){
        const refreshPayload = {
          vendorId: vendor._id,
          email: vendor.email,
        };
        const refreshSecretKey = process.env.REFRESH_TOKEN_SECRET;
        const refreshOptions = {
          expiresIn: '7d', 
        };
        return jwt.sign(refreshPayload, refreshSecretKey, refreshOptions);
};
const profile = async (req, res) => {
    const vendorId = req.user._id; 
    try {
      const vendor= await Vendor.findById(vendorId);
      if (!vendor) {
        res.status(404).json({
          status:false,
          message: 'Account not found.',
        });
      } else {
        const photoURL = process.env.BACKEND_BASE_URL + '/uploads/' + vendor.photo;
        res.status(200).json({
        status:true, 
        message: 'Profile Details.', 
        vendor: {
          ...vendor.toObject(), 
          photoURL,
        }, });
      }}
      catch(err){
        res.status(500).json({
          status:false,
          message: err.message || 'Some error occurred while getting the user.',
        });
}};
const editProfile = async (req, res) => {
    try{
        const { error } = editVendorProfileSchema.validate(req.body); 
        if (error) {
          return res.status(400).json({ status: false, message: error.details[0].message });
        }
        let photo = '';
            if (req.file) {
            photo = req.file.filename;
        }
        const vendorId = req.user._id; 
        const { role,email, ...updatedData } = req.body;
        if (email !== undefined && email !== req.user.email) {
            return res.status(400).json({status:false, message: 'You cannot change your email.' });
        }
        if (role !== undefined) {
            return res.status(400).json({status:false, message: 'Oops Sorry!!Only Admin can change your role.' });
        }
        if (photo !== '') {
            updatedData.photo = photo;
        }
        const vendor=await Vendor.findByIdAndUpdate(vendorId, updatedData, {new:true, useFindAndModify: false });
        if (!vendor) {
            res.status(404).json({
            status:false,
            message: 'Account not found.',
            });
        } else {
            res.status(200).json({status:true, message: 'Profile updated successfully.',vendor})
        }
    }catch(err){
        res.status(500).json({
          status:false,
          message: err.message || 'Some error occurred while updating the user.',
        });
    }
};
const logout = async (req, res) => {
    try {
        const vendorId = req.user._id; 
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({ status: false, message: "Account not found." });
        }
        vendor.token = undefined;
        vendor.refreshToken = undefined;
        await vendor.save();
        res.status(200).json({ status: true, message: "Logout successful.",vendor });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Some error occurred while logging out.",
      });
    }
};

module.exports = {signup,verifyOTP,login,profile,editProfile,logout
}