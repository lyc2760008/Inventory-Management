const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name."],
    },
    email: {
      type: String,
      required: [true, "Please enter an email."],
      unique: true,
      trim: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email.",
      ],
    },
    password: {
      type: String,
      required: [true, "Please enter a password."],
      minLength: [
        6,
        "password length must be equal or greater than 6 characters.",
      ],
      maxLength: [
        100,
        "password length must be equal or less than 100 characters.",
      ],
    },
    photo: {
      type: String,
      required: [true, "Please enter a photo."],
      default: "https://i.imgur.com/wZKBHSI.png",
    },
    phone: {
      type: String,
      default: "000-0000000",
    },
    bio: {
      type: String,
      maxLength: [
        250,
        "password length must be equal or less than 250 characters.",
      ],
      default: "bio",
    },
    group: {
      type: String,
      //required: [true, "Please enter a group."],
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    approved: {
      type: Boolean,
      default: false,
    },
    confirmToken: {
      type: String,
    },
    emailConfirmed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

//Encrypt password before saving to DB
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  //hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(this.password, salt);
  this.password = hashedPassword;
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;
