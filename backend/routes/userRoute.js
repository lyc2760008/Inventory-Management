const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/userController");
//const protect = require("../middleWare/authMiddleWare");
const { protect, authorize } = require("../middleWare/authMiddleWare");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);
router.get("/completeRegistration/:token", completeRegistration);
router.get("/getuser", protect, getUser);
router.get("/admingetuser/:id", protect, authorize("admin"), admingGetUser);
router.get("/loggedIn", loggedIn);
router.patch("/updateUser", protect, updateUser);
router.patch("/changePassword", protect, changePassword);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword/:resetToken", resetPassword);
router.get("/pendingUsers", protect, authorize("admin"), getPendingUsers);
router.get("/approvedUsers", protect, authorize("admin"), getApprovedUsers);
router.put("/approve/:token", protect, authorize("admin"), approveUser);

module.exports = router;
