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
const cron = require('node-cron');

const time = 1;


var bill_invoice = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM bill_invoices', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'bill_invoices.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("bill_invoices 🟢");
    });
  });

  var consolidated_bill = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM consolidated_bill', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'consolidated_bill.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("consolidated_bill 🟢");
    });
  });

  var patient_activity_staff_extra_service = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_staff_extra_service', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_staff_extra_service.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_staff_extra_service 🟢");
    });
  });

  var patient_activity_procedure_service = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_procedure_service', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_procedure_service.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_procedure_service 🟢");
    });
  });

  var patient_activity_personal_care_service = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_personal_care_service', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_personal_care_service.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_personal_care_service 🟢");
    });
  });

  var patient_activity_medical_euipments = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_medical_euipments', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_medical_euipments.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_medical_euipments 🟢");
    });
  });


  var patient_activity_medical_emergency_care = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_medical_emergency_care', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_medical_emergency_care.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_medical_emergency_care 🟢");
    });
  });

  var patient_activity_fb = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_fb', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_fb.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_fb 🟢");
    });
  });


  var patient_activity_advance = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patient_activity_advance', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patient_activity_advance.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patient_activity_advance 🟢");
    });
  });

  var patients = cron.schedule("*/1 * * * *", function () {
    db.query('SELECT * FROM patients', (err, result) => {
      if (err) {
        console.error('Error querying activity:', err);
        return;
      }
  
      const jsonData = JSON.stringify(result);
      const filePath = path.join('test', 'patients.json');
      const writeStream = fs.createWriteStream(filePath);
      writeStream.write(jsonData);
      writeStream.end();
  
      console.log("patients 🟢");
    });
  });
  
  bill_invoice.start();
  consolidated_bill.start();
  patient_activity_staff_extra_service.start();
  patient_activity_procedure_service.start();
  patient_activity_personal_care_service.start();
  patient_activity_medical_euipments.start();
  patient_activity_medical_emergency_care.start();
  patient_activity_fb.start();
  patient_activity_advance.start();
  patients.start();
