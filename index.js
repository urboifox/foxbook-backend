require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;
const httpStatus = require("./utils/httpStatus");
const path = require("path");
const fs = require("fs");

mongoose.connect(process.env.DB_URI).then(() => {
  console.log(`Connected to DB`);
});

app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());

if (!fs.existsSync(path.join(__dirname, "uploads"))) {
  fs.mkdirSync(path.join(__dirname, "uploads"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/posts", require("./routes/posts.routes"));
app.use("/api/users", require("./routes/users.routes"));

app.all("*", (_, res) => {
  res
    .status(404)
    .json({ status: httpStatus.ERROR, data: { route: `404 Not Found` } });
});

app.use((err, _, res, next) => {
  res.status(err.statusCode || 500).json({
    status: err.statusText || httpStatus.ERROR,
    code: err.statusCode || 500,
    message: err.message,
  });
  next();
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
