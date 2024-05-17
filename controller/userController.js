const { Product } = require('../model/product');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { User } = require('../model/user');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const { Vendor } = require('../model/vendor');
const { signupSchema,verifyOTPSchema,loginSchema,requestForgotPasswordSchema,
resetPasswordSchema,passwordChangeSchema,editProfileSchema,} = require('../validations/validation');
const { search } = require('../router/userRoute');
// User signup route
const signup= async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body); 
    if (error) {
      return res.status(400).json({ status: false, message: error.details[0].message });
    }
    let { email, password, firstName, lastName, phone,bio } = req.body;
    email=email.toLowerCase();
    const existingPhone = await User.findOne({ phone:phone });
    if (existingPhone) {
      return res.status(400).json({ status:false,message: 'Contact Number already exists' });
    }
    const existingUser = await User.findOne({ email:email });
    if (existingUser) {
      return res.status(400).json({ status:false,message: 'Email already exists' });
    }
    let photo = '';
    if (req.file) {
      photo = req.file.filename;
    }
    const otp = Math.floor(100000 + Math.random() * 900000); 
    sendOTP(email, otp); 
    const user = new User({
      email,
      password: await bcrypt.hash(password, 10),
      firstName,
      lastName,
      phone,
      bio,
      photo,
      otp,
      otpExpiration: new Date(Date.now() + 10 * 60 * 1000) 
    });

    await user.save();

    res.status(200).json({ status:true,message: 'You are registered successfully. Please verify your email using the OTP sent to your email.',user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status:false,error: 'Server error' });
  }
};
function sendOTP(email, otp) {
    const mailOptions = {
        from:`"Zomato Admin" <${process.env.GMAIL_EMAIL}>`,
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
    const user = await User.findOne({ email:email });
    if(!user){
        return res.status(400).json({ status:false,message: 'Account Not found' });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ status:false,message: 'Invalid OTP' });
    }
    if (user.otpExpiration < new Date()) {
        return res.status(400).json({ status:false,message: 'OTP expired' });
    }
    user.isVerified = true;
    user.otp = null;
    user.otpExpiration = null;
    await user.save();
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
      const user = await User.findOne({ email:email });
      if (!user) {
        return res.status(401).json({status:false, message: "Account not found." });
      }
      if (user.role === 'vendor' || user.isVendor) {
        return res.status(401).json({status:false, message: "Unauthorized: Vendors should log in through the vendor login Portal." });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.status(401).json({status:false, message: "Incorrect password. Please try again or reset your password" });
      }
      if (!user.isVerified) {
        return res.status(401).json({ status: false, message: "You are not verified.Please check you email for verification." });
      }
      // JWT Token after successful login
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);
      user.token = token;
      user.refreshToken = refreshToken;
      const photoURL = process.env.BACKEND_BASE_URL + '/uploads/' + user.photo;
      res.status(200).json({
        status:true,
        message: "Login successful!",
        user: {
          ...user.toObject(), 
          photoURL,
        },
      });
  
      await user.save();
    } catch (error) {
      res.status(500).json({
        status:false,
        message: error.message || "Some error occurred while logging in."
      });
    }
};
function generateToken(user) {
      const payload = {
        userId: user._id,
        email: user.email
      };
      const secretKey = process.env.JWT_SECRET; 
      const options = {
        expiresIn: '8hrs'
      };
      return jwt.sign(payload, secretKey, options);
}
function generateRefreshToken(user){
      const refreshPayload = {
        userId: user._id,
        email: user.email,
      };
      const refreshSecretKey = process.env.REFRESH_TOKEN_SECRET;
      const refreshOptions = {
        expiresIn: '7d', 
      };
      return jwt.sign(refreshPayload, refreshSecretKey, refreshOptions);
};
// Request forgot password link
const requestForgotPasswordLink = async (req, res) => {
    try {
      const { error } = requestForgotPasswordSchema.validate(req.body); 
      if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
      }
      let { email } = req.body;
      email=email.toLowerCase();
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ status: false, message: "Account not found." });
      }
      const resetToken = crypto.randomBytes(20).toString('hex');
      user.resetToken = resetToken;
      user.resetTokenExpiration = Date.now() + 3600000; 
      await user.save();
      sendResetPasswordLinkByEmail(user.email, resetToken);
      res.status(200).json({ status: true, message: "Reset password link sent to your email.",resetToken });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Some error occurred while requesting the reset password link."
      });
    }
};
function sendResetPasswordLinkByEmail(email, resetToken) {
    const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;
    const mailOptions = {
      from: `"Zomato Admin" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: 'Reset Password Link',
      text: `Click on the following link to reset your password: ${resetLink}`,
    };
    emailService.sendMail(mailOptions);
}
// Reset password using link
const resetPasswordUsingLink = async (req, res) => {
  try {
      const { error } = resetPasswordSchema.validate(req.body); 
      if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
      }
      const { newPassword, confirmPassword } = req.body;
      const { token } = req.params;
      const user = await User.findOne({ resetToken: token });
      if (!user) {
        return res.status(400).json({ status: false, message: "Invalid reset token." });
      }
      if (user.resetTokenExpiration < Date.now()) {
        return res.status(400).json({ status: false, message: "Expired reset token." });
      }
      if (newPassword !== confirmPassword) {
        return res.status(401).json({ status: false, message: "Passwords do not match." });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiration = null;
      await user.save();
      res.status(200).json({ status: true, message: "Password reset successfully." });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Some error occurred while resetting the password using the link."
      });
    }
};

//Password Change
const requestPasswordChange = async (req, res) => {
    try {
      const { error } = passwordChangeSchema.validate(req.body); 
      if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
      }
      const {oldPassword,newPassword } = req.body;
      const userId=req.user._id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({status:false, message: "Account not found." });
      }
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!passwordMatch) {
        return res.status(401).json({status:false, message: "Invalid old password." });
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      sendPasswordChangeConfirmationEmail(user.email);
      res.status(200).json({status:true, message: "Password changed successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        status:false,
        message: error.message || "Some error occurred while changing the password."
      });
    }
};
const sendPasswordChangeConfirmationEmail = (email) => {
  const mailOptions = {
    from: `"Zomato Admin" <${process.env.GMAIL_EMAIL}>`,
    to: email,
    subject: 'Password Change Successfully',
    text: 'Your password has been successfully change.',
  };
  emailService.sendMail(mailOptions);
};
//User Logout API
const logout = async (req, res) => {
    const userId = req.user._id; 
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ status: false, message: "Account not found." });
      }
      user.token = undefined;
      user.refreshToken = undefined;
      await user.save();
      res.status(200).json({ status: true, message: "Logout successful.",user });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message || "Some error occurred while logging out.",
      });
    }
};
//Account Detail
const profile = async (req, res) => {
    const userId = req.user._id; 
    try {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          status:false,
          message: 'Account not found.',
        });
      } else {
        const photoURL = process.env.BACKEND_BASE_URL + '/uploads/' + user.photo;
        res.status(200).json({
        status:true, 
        message: 'Profile Details.', 
        user: {
          ...user.toObject(), 
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
        const { error } = editProfileSchema.validate(req.body); 
        if (error) {
          return res.status(400).json({ status: false, message: error.details[0].message });
        }
        let photo = '';
            if (req.file) {
            photo = req.file.filename;
        }
        const userId = req.user._id; 
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
        const user=await User.findByIdAndUpdate(userId, updatedData, {new:true, useFindAndModify: false });
        if (!user) {
            res.status(404).json({
            status:false,
            message: 'Account not found.',
            });
        } else {
            res.status(200).json({status:true, message: 'Profile updated successfully.',user})
        }
    }catch(err){
        res.status(500).json({
          status:false,
          message: err.message || 'Some error occurred while updating the user.',
        });
    }
};
const getVendors = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ status: false, message: 'Forbidden: You are not authorized' });
    }
    const search= req.query.search; 
    let query = {};
    if (search) {
      query.name = { $regex:search, $options: 'i' };
    }
    const vendors = await Vendor.find(query);
    if (vendors.length === 0) {
      return res.status(400).json({ status: false, message: 'No vendors found' });
    }
    const vendorsWithPhotoURL = vendors.map(vendor => {
      const photoURL = process.env.BACKEND_BASE_URL + '/uploads/' + vendor.photo;
      return {
        ...vendor.toObject(),
        photoURL,
      };
    });
    res.status(200).json({ status: true, message: 'Vendors retrieved successfully', vendors: vendorsWithPhotoURL });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: false, message: 'Server Error' });
  }
};

const getProductsByVendorId = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'customer') {
      return res.status(403).json({ status: false, message: 'Forbidden: You are not authorized' });
    }
    const vendorId = req.params.vendorId;
    const search= req.query.search; 
    let query = { vendor: vendorId, deletedAt: null };
    if (search) {
      query.name = { $regex: search, $options: 'i' }; 
    }
    const products = await Product.find(query);
    if (products.length === 0) {
      return res.status(404).json({ status: false, message: 'Products not found for this vendor' });
    }
    const productsWithPhotoURL = products.map(product => ({
      ...product.toObject(),
      photoURL: process.env.BACKEND_BASE_URL + '/uploads/' + product.photo,
    }));
    res.status(200).json({
      status: true,
      message: 'Products retrieved successfully',
      products: productsWithPhotoURL,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: false, message: 'Server Error' });
  }
};


const getProduct = async (req, res) => {
  try {
      if (!req.user||req.user.role !== 'customer') {
        return res.status(403).json({ status:false,message: 'Forbidden: You are not authorized' });
      }
      const {search,searchField} = req.query;
      let query = {deletedAt:null};
      if (search && searchField) {
        const searchTerms = search.split(' ');
        const searchFields = searchField.split(','); 
        const searchPatterns = searchTerms.map((term) => new RegExp(term, 'i'));
        query['$or'] = searchFields.flatMap((field) =>
          searchPatterns.map((pattern) => ({
            [field.trim()]: { $regex: pattern },
          }))
        );
      }
      let products = await Product.aggregate([
        {
            $lookup: {
                from: 'vendors',
                localField: 'vendor',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: '$vendor' },
        { $match: query },
        {
            $project: {
                _id: 1,
                name: 1,
                price: 1,
                quantity: 1,
                photo: 1,
                vendor: {
                    _id: '$vendor._id',
                    name: '$vendor.name',
                    address: '$vendor.address',
                    photo: {
                        $concat: [process.env.BACKEND_BASE_URL + '/uploads/', '$vendor.photo']
                    }
                }
            }
        }
      ]);
      if (products.length === 0) {
        return res.status(404).json({ status: false, message: 'No products found', products });
      }
      const productsWithPhotoURL = products.map(product => {
          return {
              ...product,
              photo: process.env.BACKEND_BASE_URL + '/uploads/' + product.photo
          };
      });
      res.status(200).json({
          status: true,
          message: "Product Details",
          products: productsWithPhotoURL
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ status: false, message: 'Server Error' });
  }
};

module.exports = {signup,verifyOTP,login,requestForgotPasswordLink,resetPasswordUsingLink,requestPasswordChange,logout,profile,
    editProfile,getVendors,getProductsByVendorId , getProduct
}
