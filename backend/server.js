const express = require("express");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3001;

mongoose
  .set("strictQuery", false) //get rid of strictQuery error
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
