var db = require("../db/connection.js").mysql_pool;
const util = require("util");
const fs = require("fs");
const path = require('path');
const cron = require('node-cron');
const readline = require('readline');
const JSONStream = require('JSONStream')
var logger = require("morgan");
const cors = require('cors');

const state = (req, res) => {
    const { country } = req.query;
    const masterBranchesPath = 'datas/master_branches.json';
  
    const masterBranchesStream = fs.createReadStream(masterBranchesPath, { encoding: 'utf8' });
    const masterBranchesJsonStream = JSONStream.parse('*');
  
    masterBranchesStream.pipe(masterBranchesJsonStream);
  
    const distinctStates = new Map();
  
    masterBranchesJsonStream.on('data', (data) => {
      if (data.branch_country === country && !distinctStates.has(data.branch_state)) {
        distinctStates.set(data.branch_state, {
          branch_state: data.branch_state,
          branch_state_id: data.branch_state_id,
        });
      }
    });
  
    masterBranchesJsonStream.on('end', () => {
      res.json(Array.from(distinctStates.values()));
    });
  };
  

  const city = (req, res) => {
    const { state } = req.query;
    const masterBranchesPath = 'datas/master_branches.json';
  
    const masterBranchesStream = fs.createReadStream(masterBranchesPath, { encoding: 'utf8' });
    const masterBranchesJsonStream = JSONStream.parse('*');
  
    masterBranchesStream.pipe(masterBranchesJsonStream);
  
    const distinctCities = new Map();
  
    masterBranchesJsonStream.on('data', (data) => {
      if (data.branch_state === state && !distinctCities.has(data.branch_city)) {
        distinctCities.set(data.branch_city, {
          branch_city: data.branch_city,
          branch_state_id: data.branch_state_id,
        });
      }
    });
  
    masterBranchesJsonStream.on('end', () => {
      res.json(Array.from(distinctCities.values()));
    });
  };

  const branches = (req, res) => {
    const { city } = req.query;
    const masterBranchesPath = 'datas/master_branches.json';
  
    const masterBranchesStream = fs.createReadStream(masterBranchesPath, { encoding: 'utf8' });
    const masterBranchesJsonStream = JSONStream.parse('*');
  
    masterBranchesStream.pipe(masterBranchesJsonStream);
  
    const branchAreas = [];
  
    masterBranchesJsonStream.on('data', (data) => {
      if (data.branch_city === city) {
        branchAreas.push({
          branch_area: data.branch_name,
          branch_id: data.id,
        });
      }
    });
  
    masterBranchesJsonStream.on('end', () => {
      res.json(branchAreas);
    });
  };
  

  module.exports = {
   city,
   state,
   branches
  };
