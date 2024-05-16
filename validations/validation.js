const Joi = require('joi');

const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
  .required(),
  firstName: Joi.string().regex(/^[^\d]+$/).required(),
  lastName: Joi.string().regex(/^[^\d]+$/).required(),
  phone: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  bio: Joi.string().optional(),
  photo: Joi.string().optional(),
});
const verifyOTPSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required()
});
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
  .required(),
});
const requestForgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
  .required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword'))
  .required()
  // .label('Confirm Password')
  // .messages({ 'any.only': 'Passwords do not match.' }),
});
const passwordChangeSchema = Joi.object({
  oldPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
    .required(),
  newPassword: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
    .required(),
});
const editProfileSchema = Joi.object({
  firstName: Joi.string().regex(/^[^\d]+$/).optional(), 
  lastName: Joi.string().regex(/^[^\d]+$/).optional(), 
  phone: Joi.string().length(10).pattern(/^[0-9]+$/).optional(), 
  photo: Joi.string().optional(), bio: Joi.string().optional(),
  password:Joi.any().forbidden(),
  role: Joi.any().forbidden(), 
  email:Joi.any().forbidden(),
});
//Vendor
const vendorSignupSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,16}$'))
  .required(),
  phone: Joi.string().length(10).pattern(/^[0-9]+$/).required(),
  address:Joi.string().required(),
  description: Joi.string().optional(),
  photo: Joi.string().optional(),
});
const editVendorProfileSchema = Joi.object({
  name: Joi.string().optional(),  
  phone: Joi.string().length(10).pattern(/^[0-9]+$/).optional(), 
  address: Joi.string().optional(),
  photo: Joi.string().optional(), 
  description: Joi.string().optional(),
  role: Joi.any().forbidden(), 
  password:Joi.any().forbidden(),
  email:Joi.any().forbidden(),
});
//Product
const newProductSchema = Joi.object({
  name: Joi.string().regex(/^[^\d]+$/).required(),
  price: Joi.number().positive().required(),
  quantity: Joi.number().integer().min(1).optional(),
  photo: Joi.string().optional(), 
});
module.exports = {
  signupSchema,verifyOTPSchema,loginSchema,requestForgotPasswordSchema,resetPasswordSchema,passwordChangeSchema,
  editProfileSchema,
  vendorSignupSchema,editVendorProfileSchema,
  newProductSchema
};
