const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");
const chalk = require("chalk");
const db = require("./db/connection").mysql_pool;

const app = express();
const PORT = process.env.PORT || 8080;

const colorfulLogger = (req, res, next) => {
  const logType = req.method === 'POST' ? 'info' : 'warning'; 
  const logMessage = `${req.method} ${req.url} ${res.statusCode}`;
  const logColor = logType === 'info' ? chalk.green : chalk.yellow;
  console.log(logColor(logMessage));
  next();
};

// app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

app.use(colorfulLogger);

const routes = require("./routes/allroutes");
app.use("/", routes);

app.listen(PORT, () => {
  console.log(chalk.blue(`Server is running on port http://localhost:${PORT}`));
});
