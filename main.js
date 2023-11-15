var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var bodyParser = require("body-parser");
var cors = require("cors");
var db = require("./db/connection").mysql_pool;
var port = 8080;
const https = require("https");
const fs = require("fs");
var app = express();
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

const routes = require("./routes/allroutes");

const PORT = process.env.PORT || 8080;
app.use("/", routes)


app.listen(PORT, () => {

  console.log(`Server is running on port http://localhost:${PORT}`);
});

