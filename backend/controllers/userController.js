const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

// Register User
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, group } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be up to 6 characters");
  }

  // Set default value for group
  const userGroup = group || "default";

  // Check if user email already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("Email has already been registered");
  }

  const confirmToken = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
    group: userGroup,
    role: "user",
    approved: false,
    emailConfirmed: false, // Add a new field to store if the email has been confirmed
    confirmToken, // Store the confirmation token in the user model
  });

  // Generate Token for approval link
  const approveToken = generateToken(user._id + "approve");

  // Send approval email
  const subject = "Account Approval";
  const message = `Dear Admin, 
                       A new user with email address ${email} has registered on the platform and needs approval. Please click the link below to approve the user:
                       ${process.env.FRONTEND_URL}/approve-user/${approveToken}
                     `;
  const to = process.env.EMAIL_USER;
  const from = process.env.EMAIL_USER;

  await sendEmail(subject, message, to, from);

  // Send HTTP-only cookie with login token
  /////////////////////////////////////////////////////////////////////////
  const token = generateToken(user._id);
  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + 1000 * 86400), // 1 day
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "development" ? false : true,
  });

  if (user) {
    const { _id, name, email, photo, phone, bio, group, role } = user;
    res.status(201).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      group,
      role,
      token,
      message: "Registration successful. Please wait for approval",
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate Request
  if (!email || !password) {
    res.status(400);
    throw new Error("Please add email and password");
  }

  // Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }

  // Check if user is approved
  if (!user.approved) {
    res.status(401);
    throw new Error(
      "Your account has not been approved yet. Please wait for approval."
    );
  }

  // Check if user is confirmed
  if (!user.emailConfirmed) {
    res.status(401);
    throw new Error(
      "Your account has not been confirmed to login. Please check your email."
    );
  }

  // User exists and is approved, check if password is correct
  const passwordIsCorrect = await bcrypt.compare(password, user.password);

  //   Generate Token
  const token = generateToken(user._id);

  if (passwordIsCorrect) {
    // Send HTTP-only cookie
    res.cookie("token", token, {
      path: "/",
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 86400), // 1 day
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: (process.env.NODE_ENV = "development" ? false : true),
    });
  }
  if (user && passwordIsCorrect) {
    const { _id, name, email, photo, phone, bio, group, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      group,
      role,
      token,
    });
  } else {
    res.status(400);
    throw new Error("Invalid email or password");
  }
});

// Logout User
const logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: (process.env.NODE_ENV = "development" ? false : true),
  });
  return res.status(200).json({ message: "Successfully Logged Out" });
});

// Get User Data
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    const { _id, name, email, photo, phone, bio, group, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      group,
      role,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

// Admin only to Get a specific User Data
const admingGetUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    const { _id, name, email, photo, phone, bio, group, role } = user;
    res.status(200).json({
      _id,
      name,
      email,
      photo,
      phone,
      bio,
      group,
      role,
    });
  } else {
    res.status(400);
    throw new Error("User Not Found");
  }
});

// Get login status
const loggedIn = asyncHandler(async (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.json(false);
  }
  // Verify Token
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  if (verified) {
    // Check if user is approved
    const user = await User.findById(verified.id);
    if (!user || !user.approved) {
      return res.json(false);
    }
    return res.json(true);
  }
  return res.json(false);
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    const { name, email, photo, phone, bio } = user;
    user.email = email;
    user.name = req.body.name || name;
    user.phone = req.body.phone || phone;
    user.bio = req.body.bio || bio;
    user.photo = req.body.photo || photo;

    const updatedUser = await user.save();
    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { oldPassword, password } = req.body;

  if (!user) {
    res.status(400);
    throw new Error("User not found, please signup");
  }
  //Validate
  if (!oldPassword || !password) {
    res.status(400);
    throw new Error("Please enter both old and new passwords");
  }

  // check if old password matches password in DB
  const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password);

  // Save new password
  if (user && passwordIsCorrect) {
    user.password = password;
    await user.save();
    res.status(200).send("Password changed successful");
  } else {
    res.status(400);
    throw new Error("Old password is incorrect");
  }
});

//reset password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // Delete token if it exists in DB
  let token = await Token.findOne({ userId: user._id });
  if (token) {
    await token.deleteOne();
  }

  // Create Reste Token
  let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
  //console.log(resetToken);

  // Hash token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save Token to DB
  await new Token({
    userId: user._id,
    token: hashedToken,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
  }).save();

  // Construct Reset Url
  const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  // Reset Email
  const message = `
      <h2>Hello ${user.name}</h2>
      <p>Please use the url below to reset your password</p>  
      <p>This reset link is valid for only 30minutes.</p>
      <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      <p>Regards...</p>
      <p>Yichen Team</p>
    `;
  const subject = "Password Reset Request";
  const send_to = user.email;
  const sent_from = process.env.EMAIL_USER;

  try {
    await sendEmail(subject, message, send_to, sent_from);
    res.status(200).json({ success: true, message: "Reset Email Sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resetToken } = req.params;

  // Hash token, then compare to Token in DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // fIND tOKEN in DB
  const userToken = await Token.findOne({
    token: hashedToken,
    expiresAt: { $gt: Date.now() },
  });

  if (!userToken) {
    res.status(404);
    throw new Error("Invalid or Expired Token");
  }

  // Find user
  const user = await User.findOne({ _id: userToken.userId });
  user.password = password;
  await user.save();
  res.status(200).json({
    message: "Password Reset Successful, Please Login",
  });
});

const getPendingUsers = asyncHandler(async (req, res) => {
  const pendingUsers = await User.find({ approved: false });
  res.status(200).json(pendingUsers);
});

const getApprovedUsers = asyncHandler(async (req, res) => {
  const approvedUsers = await User.find({ approved: true });
  res.status(200).json(approvedUsers);
});

// approve User
const approveUser = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id.toString().substring(0, 24);
  const user = await User.findById(userId);

  if (user) {
    if (user.approved) {
      res.status(400);
      throw new Error("User is already approved");
    }

    user.approved = true;

    const updatedUser = await user.save();

    // Send email to user
    const confirmToken = jwt.sign(
      { id: updatedUser._id },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );
    const message = `
      <h2>Hello ${updatedUser.name}</h2>
      <p>Your registration to our app has been approved!</p>  
      <p>Please click the following link to confirm your registration:</p>
      <a href="${process.env.FRONTEND_URL}/complete-registration/${confirmToken}">${process.env.FRONTEND_URL}/complete-registration/${confirmToken}</a>
      <p>Regards...</p>
      <p>Yichen Team</p>
    `;
    const subject = "Registration Approved";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
      await sendEmail(subject, message, send_to, sent_from);
    } catch (error) {
      console.error("Error sending approval email: ", error);
    }

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      group: updatedUser.group,
      role: updatedUser.role,
      approved: updatedUser.approved,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// complete Registration
const completeRegistration = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.id.toString().substring(0, 24);
  const user = await User.findById(userId);

  if (user) {
    if (user.emailConfirmed) {
      res.status(400);
      throw new Error("Email is already confirmed");
    }

    user.emailConfirmed = true;

    const updatedUser = await user.save();

    // Send welcome email
    const message = `
      <h2>Hello ${user.name}</h2>
      <p>Thank you for registering on our app. Your account is now fully approved and you can start using our app.</p>  
      <p>Regards...</p>
      <p>Yichen Team</p>
    `;
    const subject = "Registration Complete";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;

    try {
      await sendEmail(subject, message, send_to, sent_from);
    } catch (error) {
      console.error("Error sending welcome email: ", error);
    }

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      photo: updatedUser.photo,
      phone: updatedUser.phone,
      bio: updatedUser.bio,
      group: updatedUser.group,
      role: updatedUser.role,
      approved: updatedUser.approved,
      emailConfirmed: updatedUser.emailConfirmed,
    });
  } else {
    res.status(404);
    throw new Error("completeRegistration User not found!!!");
  }
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  getUser,
  loggedIn,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  getPendingUsers,
  getApprovedUsers,
  approveUser,
  admingGetUser,
  completeRegistration,
};
