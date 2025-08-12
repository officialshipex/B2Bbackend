if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const { validateForm, validateEmail } = require("../utils/afv");
const User = require("../models/User.model");
const Role = require("../models/roles.modal");
const RateCard=require("../models/rateCards")
const Plan=require("../models/Plan.model")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendWelcomeEmail } = require("../notification/welcomeNotification");
const FRONTEND_URL =
  process.env.NODE_ENV != "production"
    ? "http://localhost:5173"
    : process.env.FRONTEND_URL;
//for User Registration
const register = async (req, res) => {
  try {
    const {
      fullname,
      email,
      phoneNumber,
      company,
      monthlyOrders,
      password,
      confirmedPassword,
      checked,
    } = req.body;
    console.log(req.body);

    if (
      !fullname ||
      !email ||
      !phoneNumber ||
      !company ||
      !monthlyOrders ||
      !password ||
      !confirmedPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const userData = {
      fullname,
      email,
      phoneNumber,
      company,
      monthlyOrders,
      password,
      confirmedPassword,
      checked,
    };

    const validateFields = validateForm(userData);

    if (Object.keys(validateFields).length) {
      return res.status(400).json({
        success: false,
        message: validateFields,
      });
    }
    let userId;
    let isUnique = false;

    while (!isUnique) {
      userId = Math.floor(10000 + Math.random() * 90000); // Generates a random five-digit number
      const existingUser = await User.findOne({ userId });

      if (!existingUser) {
        isUnique = true;
      }
    }
    const userEmail = await User.findOne({ email });
    const userPhoneNumber = await User.findOne({ phoneNumber });
    const userCompany = await User.findOne({ company });

    if (userPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone Number already exists",
      });
    }

    if (userEmail) {
      return res.status(400).json({
        success: false,
        message: "Email or User already exists",
      });
    }
    if (userCompany) {
      return res.status(400).json({
        success: false,
        message: "Company already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      phoneNumber,
      company,
      monthlyOrders,
      password: hashedPassword,
      userId,
    });

    await newUser.save();
    await sendWelcomeEmail(email, fullname);

    // Fetch the "Bronze" rate card
    const bronzeRateCard = await RateCard.find({ plan: "bronze" });

    if (!bronzeRateCard) {
      return res.status(500).json({
        success: false,
        message: "Bronze rate card not found",
      });
    }

    // Assign the "Bronze" rate card to the new user
    const newPlan = new Plan({
      userId: newUser._id,
      userName: fullname,
      planName: "bronze", 
      // rateCard: bronzeRateCard,
    });

    await newPlan.save();

    const payload = {
      user: {
        id: newUser._id,
        email: newUser.email,
        fullname: newUser.fullname,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    //welcome email

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: token,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//For User Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const validateFields = validateEmail(email);

    if (!validateFields) {
      return res.status(400).json({
        success: false,
        message: "Invalid email ",
      });
    }

    const user = await User.findOne({ email });
    // console.log("user", user);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    const payload = {
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
        kyc: user.kycDone,
        isAdmin: user.isAdmin,
        isEmployee: false,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      kyc: user.kycDone,
      data: token,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//For successfull Google login
const googleLogin = async (req, res) => {
  try {
    const profile = req.user;
    // console.log("profile", profile);
    const userExist = await User.findOne({ email: profile.email });
    if (!userExist) {
      const newUser = new User({
        fullname: profile.name.givenName,
        email: profile.email,
        monthlyOrders: profile.monthlyOrders || 0,
        googleOAuthID: profile.id,
        isVerified: profile.email_verified,
        provider: "Google",
      });

      await newUser.save();
    }

    const user = await User.findOne({ email: profile.email });
    const payload = {
      user: {
        id: user._id,
        email: user.email,
        fullname: user.fullname,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.redirect(`${FRONTEND_URL}/login?token=${token}`);

    // return res.status(200).json({
    //   success: true,
    //   message: "User logged in successfully",
    //   data: token,
    // })
  } catch (error) {
    console.log("error", error);
    return res.redirect(`${FRONTEND_URL}`);
    // return res.status(500).json({
    //   success: false,
    //   message: "Internal server error",
    // });
  }
};

//for failure google login
const googleLoginFail = (req, res) => {
  try {
    return res.status(400).json({
      success: false,
      message: "Google login failed",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifySession = async (req, res) => {
  try {
    const session = req.headers.authorization;

    if (!session) {
      return res.status(400).json({
        success: false,
        message: "Session not found",
      });
    }

    const token = session.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token not found",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    // User session
    if (decoded.user && decoded.user.isEmployee === false) {
      const user = await User.findById(decoded.user.id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
      return res.status(200).json({
        success: true,
        kyc: user.kycDone,
        message: "Token verified",
        type: "user",
      });
    }
    // Employee session
    else if (decoded.employee && decoded.employee.isEmployee === true) {
      const employee = await Role.findById(decoded.employee.id);
      if (!employee) {
        return res.status(400).json({
          success: false,
          message: "Employee not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Token verified",
        type: "employee",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload",
      });
    }
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const forgetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password Reset successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating password", error });
  }
};



module.exports = {
  register,
  login,
  googleLogin,
  googleLoginFail,
  verifySession,
  forgetPassword
};
