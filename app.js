const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Goods = require("./models/goods");
const Carts = require("./models/cart");
const authMiddleware = require("./middlewares/auth-middleware");


mongoose.set("strictQuery", true); //mongoose version 7 error handle
mongoose.connect("mongodb://localhost/shopping-demo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));

const app = express();
const router = express.Router();