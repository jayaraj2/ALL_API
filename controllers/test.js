var db = require("../db/connection.js").mysql_pool;
const util = require("util");
const fs = require("fs");
const path = require('path');
const cron = require('node-cron');
const readline = require('readline');
const JSONStream = require('JSONStream')
var logger = require("morgan");
const cors = require('cors');




 const tax = (req, res) => {
    const { branch, start, end, city, state } = req.query;
    const usersDataPath = 'datas/users.json';
    const patientSchedulesDataPath = 'datas/patient_schedules.json';
    const masterBranchesPath = 'datas/master_branches.json';
  
    const usersStream = fs.createReadStream(usersDataPath, { encoding: 'utf8' });
    const patientSchedulesStream = fs.createReadStream(patientSchedulesDataPath, { encoding: 'utf8' });
    const masterBranchesStream = fs.createReadStream(masterBranchesPath, { encoding: 'utf8' });
  
    const usersJsonStream = JSONStream.parse('*');
    const patientSchedulesJsonStream = JSONStream.parse('*');
    const masterBranchesJsonStream = JSONStream.parse('*');
  
    usersStream.pipe(usersJsonStream);
    patientSchedulesStream.pipe(patientSchedulesJsonStream);
    masterBranchesStream.pipe(masterBranchesJsonStream);
  
    const usersData = {};
    const masterBranchesData = {};
  
    usersJsonStream.on('data', (data) => {
      usersData[data.id] = data;
    });
  
    masterBranchesJsonStream.on('data', (data) => {
      masterBranchesData[data.id] = data;
    });
  
    let monthlyData = new Map();
    let dailyData = new Map();
  
    patientSchedulesJsonStream.on('data', (data) => {
      const branchId = usersData[data.patient_id]?.branch_id;
  
      if (!branchId) {
        return;
      }
  
      const activityDate = new Date(data.schedule_date);
  
      if (
        data.membership_type === 'Monthly' &&
        (!branch || branch === branchId) &&
        (!city || masterBranchesData[branchId]?.branch_city_id == city) &&
        (!state || masterBranchesData[branchId]?.branch_state_id == state) &&
        (!start || activityDate >= new Date(start)) &&
        (!end || activityDate <= new Date(end))
      ) {
        if (!monthlyData.has(branchId)) {
          monthlyData.set(branchId, { total_sum_gross: 0.0, total_tax: 0.0, total_sum_with_tax: 0.0 });
        }
  
        monthlyData.get(branchId).total_sum_gross += parseFloat(data.gross_rate);
        monthlyData.get(branchId).total_tax += parseFloat(data.tax_rate);
        monthlyData.get(branchId).total_sum_with_tax +=
          parseFloat(data.gross_rate) + parseFloat(data.tax_rate);
      }
  
      if (
        data.membership_type === 'Daily' &&
        (!branch || branch === branchId) &&
        (!city || masterBranchesData[branchId]?.branch_city_id == city) &&
        (!state || masterBranchesData[branchId]?.branch_state_id == state) &&
        (!start || activityDate >= new Date(start)) &&
        (!end || activityDate <= new Date(end))
      ) {
        if (!dailyData.has(branchId)) {
          dailyData.set(branchId, { total_sum_gross: 0.0, total_tax: 0.0, total_sum_with_tax: 0.0 });
        }
  
        dailyData.get(branchId).total_sum_gross += parseFloat(data.gross_rate);
        dailyData.get(branchId).total_tax += parseFloat(data.tax_rate);
        dailyData.get(branchId).total_sum_with_tax +=
          parseFloat(data.gross_rate) + parseFloat(data.tax_rate);
      }
    });
  
    patientSchedulesJsonStream.on('end', () => {
      const response = [];
  
      monthlyData.forEach((value, branchId) => {
        const branchInfo = masterBranchesData[branchId];
        if (branchInfo) {
          const branchResponse = {
            type: "Monthly",
            branch_name: branchInfo.branch_name,
            total_sum_gross: value.total_sum_gross.toFixed(2),
            total_tax: value.total_tax.toFixed(2),
            total_sum_with_tax: value.total_sum_with_tax.toFixed(2),
          };
          response.push(branchResponse);
        }
      });
  
      dailyData.forEach((value, branchId) => {
        const branchInfo = masterBranchesData[branchId];
        if (branchInfo) {
          const branchResponse = {
            type: "Daily",
            branch_name: branchInfo.branch_name,
            total_sum_gross: value.total_sum_gross.toFixed(2),
            total_tax: value.total_tax.toFixed(2),
            total_sum_with_tax: value.total_sum_with_tax.toFixed(2),
          };
          response.push(branchResponse);
        }
      });
  
      res.json(response);
    });
  };



const getConsolidatedBill = (req, res) => {
  const { branch, city, state, start, end } = req.query;
  const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
  const consolidatedBillDataPath = 'datas/consolidated_bill.json';
  const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));

  const branchData = {};
  let totalAllBranchSum = {
    total_branch_sum_pending: 0.0,
    total_branch_sum_paid: 0.0,
    total_branch_sum_partial: 0.0,
    total_branch_sum_all_statuses: 0.0,
  };

  const fileStream = fs.createReadStream(consolidatedBillDataPath, { encoding: 'utf8' });
  const jsonStream = JSONStream.parse('*');

  fileStream.pipe(jsonStream);

  jsonStream.on('data', (data) => {
    if (!data) {
      return;
    }

    const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id || 'undefined';
    const branchInfo = masterBranches.find((branch) => branch.id === branchId);
    const activityDate = new Date(data.created_at);

    const isWithinDateRange = (!start || activityDate >= new Date(start)) &&
      (!end || activityDate <= new Date(end));

    const isMatchingCity = !city || branchInfo.branch_city_id == city;
    const isMatchingState = !state || branchInfo.branch_state_id == state;

    if ((!branch || branch === branchId) && isWithinDateRange && isMatchingCity && isMatchingState) {
      if (!branchData[branchId]) {
        branchData[branchId] = {
          total_branch_sum_pending: 0.0,
          total_branch_sum_paid: 0.0,
          total_branch_sum_partial: 0.0,
          total_branch_sum_all_statuses: 0.0,
          data: [],
        };
      }

      const totalAmount = parseFloat(data.total_amount);
      if (!isNaN(totalAmount)) {
        branchData[branchId].total_branch_sum_all_statuses += totalAmount;

        if (data.payment_status === 'Pending') {
          branchData[branchId].total_branch_sum_pending += totalAmount;
        } else if (data.payment_status === 'Paid') {
          branchData[branchId].total_branch_sum_paid += totalAmount;
        } else if (data.payment_status === 'Partial') {
          branchData[branchId].total_branch_sum_partial += totalAmount;
        }

        branchData[branchId].data.push({
          id: data.id,
          branch_name: branchInfo.branch_name,
          branch_id: branchId,
          first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
          last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
          patient_id: data.patient_id,
          created_at: data.created_at,
          status: data.status,
          payment_status: data.payment_status,
          total_amount: totalAmount.toFixed(2),
        });
      }
    }
  });

  jsonStream.on('end', () => {
    const response = [];

    masterBranches.forEach((branchInfo) => {
      const branchId = branchInfo.id;

      if (branchData[branchId]) {
        const branchTotalAmount = parseFloat(branchData[branchId].total_branch_sum_all_statuses);

        const branchResponse = {
          branch: branchInfo.branch_name,
          total_branch_sum_pending: branchData[branchId].total_branch_sum_pending.toFixed(2),
          total_branch_sum_paid: branchData[branchId].total_branch_sum_paid.toFixed(2),
          total_branch_sum_partial: branchData[branchId].total_branch_sum_partial.toFixed(2),
          total_branch_sum_all_statuses: branchData[branchId].total_branch_sum_all_statuses.toFixed(2),
          data: branchData[branchId].data,
        };

        response.push(branchResponse);
      } else {
        const defaultBranchResponse = {
          branch: branchInfo.branch_name,
          total_branch_sum_pending: 0.0,
          total_branch_sum_paid: 0.0,
          total_branch_sum_partial: 0.0,
          total_branch_sum_all_statuses: 0.0,
          data: [],
        };

        response.push(defaultBranchResponse);
      }
    });

    for (const branchId in branchData) {
      totalAllBranchSum.total_branch_sum_pending += branchData[branchId].total_branch_sum_pending;
      totalAllBranchSum.total_branch_sum_paid += branchData[branchId].total_branch_sum_paid;
      totalAllBranchSum.total_branch_sum_partial += branchData[branchId].total_branch_sum_partial;
      totalAllBranchSum.total_branch_sum_all_statuses += branchData[branchId].total_branch_sum_all_statuses;
    }

    response.unshift({
      ...totalAllBranchSum,
      service_Type: "Staff Extra service"
    });

    res.json(response);
  });
};







  
const medical_equipments = (req, res) => {
  const { start, end, city, state, branch } = req.query;
  const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
  const patientEmergencyEqpDataPath = 'datas/patient_activity_medical_euipments.json';
  const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  const masterMedicalEquipments = JSON.parse(fs.readFileSync('datas/master_medical_equipments.json'));

  const branchData = {};
  const totalSumEmergencyEqp = {};

  const fileStream = fs.createReadStream(patientEmergencyEqpDataPath, { encoding: 'utf8' });
  const jsonStream = JSONStream.parse('*');

  fileStream.pipe(jsonStream);

  jsonStream.on('data', (data) => {
    if (!data) {
      return;
    }

    const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id || 'undefined';
    const branchInfo = masterBranches.find((branch) => branch.id === branchId);

    const activityDate = new Date(data.created_at);

    const isWithinDateRange = (!start || activityDate >= new Date(start)) &&
      (!end || activityDate <= new Date(end));

    const isCityMatching = !city || branchInfo.branch_city_id == city;
    const isStateMatching = !state || branchInfo.branch_state_id == state;
    const isBranchMatching = !branch || branch === branchId;

    if (isWithinDateRange && isCityMatching && isStateMatching && isBranchMatching) {
      if (!branchData[branchId]) {
        branchData[branchId] = { total_medical_equipment_amount: 0.0, data: [] };
      }

      const eqpId = data.medical_equipment_id;
      const eqpAmount = parseFloat(data.medical_equipment_amount);
      const matchingMedicalEquipment = masterMedicalEquipments.find((item) => item.id === eqpId);

      if (!isNaN(eqpAmount) && eqpAmount > 0) {
        branchData[branchId].total_medical_equipment_amount += eqpAmount;
        branchData[branchId].data.push({
          branch: branchId,
          branch_name: branchInfo.branch_name,
          patient_id: data.patient_id,
          first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
          last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
          medical_equipment_amount: eqpAmount.toFixed(2),
          item_name: matchingMedicalEquipment ? matchingMedicalEquipment.item_name : 'N/A',
        });

        if (!totalSumEmergencyEqp[branchId]) {
          totalSumEmergencyEqp[branchId] = 0.0;
        }
        totalSumEmergencyEqp[branchId] += eqpAmount;
      }
    }
  });

  jsonStream.on('end', () => {
    const response = [];

    masterBranches.forEach((branchInfo) => {
      const branchId = branchInfo.id;
      const branchTotalAmount = parseFloat(branchData[branchId]?.total_medical_equipment_amount || 0);

      const dataForBranch = branchData[branchId]?.data || [];

      const totalMedicalEquipmentAmount = dataForBranch.reduce((total, item) => total + parseFloat(item.medical_equipment_amount), 0);

      response.push({
        branch_name: branchInfo.branch_name,
        total_medical_equipment_amount: (branchTotalAmount + totalMedicalEquipmentAmount).toFixed(2),
        data: dataForBranch,
      });
    });

    let totalSum = 0.0;
    for (const branchId in totalSumEmergencyEqp) {
      totalSum += totalSumEmergencyEqp[branchId];
    }

    if (totalSum > 0 || response.length === 0) {
      response.unshift({ total_medical_equipment_amount: totalSum.toFixed(2), Service_Type: "Medical Equipments" });
    }

    res.json(response);
  });
};


const fb = (req, res) => {
  const { branch, start, end, city, state } = req.query;
  const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
  const patientFBDataPath = 'datas/patient_activity_fb.json';
  const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  const masterFoodBevarages = JSON.parse(fs.readFileSync('datas/master_food_bevarages.json'));

  const branchData = {};
  const totalBranchSum = {};

  const fileStream = fs.createReadStream(patientFBDataPath, { encoding: 'utf8' });
  const jsonStream = JSONStream.parse('*');

  fileStream.pipe(jsonStream);

  jsonStream.on('data', (data) => {
    if (!data) {
      return;
    }

    const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
    if (!branchId) {
      return;
    }

    const branchInfo = masterBranches.find((branch) => branch.id === branchId);
    global.branchey = masterBranches.find((branch) => branch.id === branchId);

    if (
      ((!branch || branch === 'all' || branch === branchId) &&
        (!city || branchInfo.branch_city_id == city) &&
        (!state || branchInfo.branch_state_id == state))
    ) {
      if (!branchData[branchId]) {
        branchData[branchId] = { data: [] };
      }

      const activityDate = new Date(data.created_at);
      if (
        (!start || activityDate >= new Date(start)) &&
        (!end || activityDate <= new Date(end))
      ) {
        const fbId = data.fb_id;
        const fbData = masterFoodBevarages.find((fb) => fb.id === fbId);

        if (fbData) {
          const itemName = fbData.item_name;
          const fbAmount = parseFloat(data.fb_amount) || 0;

          const userDetails = {
            patient_id: data.patient_id,
            first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
            last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
            fb_amount: data.fb_amount || "Not found",
            invoice_status: data.invoice_status,
            payment_status: data.payment_status,
            service: itemName,
          };

          if (fbAmount > 0) {
            branchData[branchId].data.push({
              branch: branchId,
              branch_name: branchInfo.branch_name,
              ...userDetails,
            });

            if (!totalBranchSum[branchId]) {
              totalBranchSum[branchId] = 0.0;
            }

            totalBranchSum[branchId] += fbAmount;
          }
        }
      }
    }
  });

  jsonStream.on('end', () => {
    const response = [];

    masterBranches.forEach((branchInfo) => {
      const branchId = branchInfo.id;

      if (branchData[branchId]) {
        const branchTotalAmount = parseFloat(totalBranchSum[branchId]) || 0;

        const branchResponse = {
          branch_name: branchInfo.branch_name,
          total_fb_amount: branchTotalAmount.toFixed(2),
          data: branchData[branchId].data || [],
        };

        response.push(branchResponse);
      } else {
        const defaultBranchResponse = {
          branch_name: branchInfo.branch_name,
          total_fb_amount: 0.0,
          data: [],
        };

        response.push(defaultBranchResponse);
      }
    });

    let totalSum = 0.0;

    for (const branchId in totalBranchSum) {
      totalSum += parseFloat(totalBranchSum[branchId]) || 0;
    }

    if (!isNaN(totalSum)) {
      response.unshift({ total_fb_amount: totalSum.toFixed(2), service_type: "Food & Beverages" });
    } else {
      response.unshift({ total_fb_amount: '0.00', service_type: "Food & Beverages" });
    }

    res.json(response);
  });
};


  
const personal_care = (req, res) => {
  const { branch, start, end, city, state } = req.query;
  const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
  const patientPersonalCareDataPath = 'datas/patient_activity_personal_care_service.json';
  const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  const masterPersonalCareServices = JSON.parse(fs.readFileSync('datas/master_personal_care_services.json'));

  const branchData = {};
  let totalSumPersonalCare = 0.0;

  const fileStream = fs.createReadStream(patientPersonalCareDataPath, { encoding: 'utf8' });
  const jsonStream = JSONStream.parse('*');

  fileStream.pipe(jsonStream);

  jsonStream.on('data', (data) => {
    if (!data) {
      return;
    }

    const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
    if (!branchId) {
      return;
    }

    const branchInfo = masterBranches.find((branch) => branch.id === branchId);

    if (
      (!city || branchInfo.branch_city_id == city) &&
      (!state || branchInfo.branch_state_id == state)
    ) {
      if (!branchData[branchId]) {
        branchData[branchId] = { total_sum_personal_care: 0.0, data: [] };
      }

      const activityDate = new Date(data.created_at);
      if (
        (!start || activityDate >= new Date(start)) &&
        (!end || activityDate <= new Date(end))
      ) {
        const personalCareId = data.personal_care_id;
        const personalCareAmount = parseFloat(data.personal_care_amount);

        if (!isNaN(personalCareAmount) && personalCareAmount > 0) {
          const matchingPersonalCareService = masterPersonalCareServices.find(
            (item) => item.id === personalCareId
          );

          branchData[branchId].total_sum_personal_care += personalCareAmount;
          branchData[branchId].data.push({
            patient_id: data.patient_id,
            first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
            last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
            personal_care_amount: personalCareAmount.toFixed(2),
            item_name: matchingPersonalCareService ? matchingPersonalCareService.item_name : 'N/A',
          });
          totalSumPersonalCare += personalCareAmount;
        }
      }
    }
  });

  jsonStream.on('end', () => {
    const response = [];

    if (branch) {
      if (branchData[branch]) {
        const branchName = masterBranches.find((branchItem) => branchItem.id === branch).branch_name;
        const branchResponse = {
          branch_name: branchName,
          total_sum_personal_care: branchData[branch].total_sum_personal_care.toFixed(2),
          data: branchData[branch].data,
        };
        response.push(branchResponse);
        const totalBranchSum = branchData[branch].total_sum_personal_care.toFixed(2);
        response.unshift({ branch_name: branchName, total_sum_personal_care: totalBranchSum });
      } else {
        return res.status(404).json({ message: 'No data found for the given branch' });
      }
    } else {
      for (const branchId in branchData) {
        const branchInfo = masterBranches.find((branch) => branch.id === branchId);
        const branchResponse = {
          branch_name: branchInfo.branch_name,
          total_sum_personal_care: branchData[branchId].total_sum_personal_care.toFixed(2),
          data: branchData[branchId].data,
        };
        response.push(branchResponse);
      }
      response.unshift({ total_sum_personal_care: totalSumPersonalCare.toFixed(2), service_Type: "Personal Care" });
    }

    res.json(response);
  });
};

const procedural_service = (req, res) => {
  const { branch, start, end, city, state } = req.query;
  const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
  const patientProcedureServiceDataPath = 'datas/patient_activity_procedure_service.json';
  const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  const masterProcedureServices = JSON.parse(fs.readFileSync('datas/master_procedure_services.json'));

  const branchData = {};
  const totalBranchSum = {};

  const fileStream = fs.createReadStream(patientProcedureServiceDataPath, { encoding: 'utf8' });
  const jsonStream = JSONStream.parse('*');

  fileStream.pipe(jsonStream);

  jsonStream.on('data', (data) => {
    if (!data) {
      return;
    }

    const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
    if (!branchId) {
      return;
    }

    const branchInfo = masterBranches.find((branchItem) => branchItem.id === branchId);

    if (
      (!branch || branch === branchInfo.id) &&
      (!city || branchInfo.branch_city_id == city) &&
      (!state || branchInfo.branch_state_id == state)
    ) {
      if (!branchData[branchId]) {
        branchData[branchId] = { total_procedure_service_amount: 0.0, data: [] };
      }

      const activityDate = new Date(data.created_at);
      if (
        (!start || activityDate >= new Date(start)) &&
        (!end || activityDate <= new Date(end))
      ) {
        const procedureServiceAmount = parseFloat(data.procedure_service_amount);
        if (procedureServiceAmount > 0) {
          branchData[branchId].total_procedure_service_amount += procedureServiceAmount;

          const procedureServiceId = data.procedure_service_id;
          const matchingProcedureService = masterProcedureServices.find((service) => service.id === procedureServiceId);

          branchData[branchId].data.push({
            branch_name: branchInfo.branch_name,
            branch_id: branchId,
            patient_id: data.patient_id,
            first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
            last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
            invoice_status: data.invoice_status,
            procedure_service_amount: procedureServiceAmount.toFixed(2),
            procedure_service_name: matchingProcedureService ? matchingProcedureService.procedure_service_name : 'N/A',
          });
        }
      }
    }
  });

  jsonStream.on('end', () => {
    const response = [];
    let totalSum = 0.0;

    if (branch) {
      const branchInfo = masterBranches.find((branchItem) => branchItem.id === branch);
      if (branchData[branch]) {
        const branchName = branchInfo.branch_name;
        const branchResponse = {
          branch_name: branchName,
          total_procedure_service_amount: branchData[branch].total_procedure_service_amount.toFixed(2),
          data: branchData[branch].data,
        };
        response.push(branchResponse);
        const totalBranchSum = branchData[branch].total_procedure_service_amount.toFixed(2);
        response.unshift({ branch_name: branchName, total_procedure_service_amount: totalBranchSum });
      } else {
        response.push({
          branch_name: branchInfo.branch_name,
          total_procedure_service_amount: '0.00',
          data: [],
        });
      }
    } else {
      masterBranches.forEach((branchInfo) => {
        const branchId = branchInfo.id;
        const branchTotalAmount = parseFloat(branchData[branchId]?.total_procedure_service_amount) || 0.0;
        const dataForBranch = branchData[branchId]?.data || [];

        const totalProcedureServiceAmountForBranch = dataForBranch.reduce(
          (total, item) => total + parseFloat(item.procedure_service_amount),
          0
        );

        response.push({
          branch_name: branchInfo.branch_name,
          total_procedure_service_amount: (branchTotalAmount + totalProcedureServiceAmountForBranch).toFixed(2),
          data: dataForBranch,
        });

        totalSum += branchTotalAmount + totalProcedureServiceAmountForBranch;
      });

      if (totalSum > 0 || response.length === 0) {
        response.unshift({ total_procedure_service_amount: totalSum.toFixed(2), Service_Type: "Procedural Service" });
      }
    }

    res.json(response);
  });
};



const patient_advance = (req, res) => {
    const { branch, start, end, city, state } = req.query;
    const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
    const patientAdvanceDataPath = 'datas/patient_activity_advance.json';
    const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  
    const branchData = {};
    let totalSumActivityRate = 0.0;
  
    const fileStream = fs.createReadStream(patientAdvanceDataPath, { encoding: 'utf8' });
    const jsonStream = JSONStream.parse('*');
  
    fileStream.pipe(jsonStream);
  
    jsonStream.on('data', (data) => {
      if (!data) {
        return;
      }
  
      const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
      if (!branchId) {
        return;
      }
  
      const branchInfo = masterBranches.find((branch) => branch.id === branchId);
  
      if (
        (!city || branchInfo.branch_city_id == city) &&
        (!state || branchInfo.branch_state_id == state)
      ) {
        if (!branchData[branchId]) {
          branchData[branchId] = { total_activity_rate: 0.0, data: [] };
        }
  
        const activityDate = new Date(data.created_at);
        if (
          (!start || activityDate >= new Date(start)) &&
          (!end || activityDate <= new Date(end))
        ) {
          const activityRate = parseFloat(data.activity_rate);
          if (!isNaN(activityRate)) {
            branchData[branchId].total_activity_rate += activityRate;
            branchData[branchId].data.push({
              branchId: branchId,
              branchname: branchInfo.branch_name,
              patient_id: data.patient_id,
              patient_id: data.patient_id,
              first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
              last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
              activityname: data.activity_name,
              invoice_status: data.invoice_status,
              scheduleDate: data.schedule_date,
              activity_rate: activityRate.toFixed(2),
            });
          }
        }
      }
    });
  
    jsonStream.on('end', () => {
      const response = [];
  
      if (branch) {
        if (branchData[branch]) {
          const branchName = masterBranches.find((branchItem) => branchItem.id === branch).branch_name;
          const branchResponse = {
            branch_name: branchName,
            total_activity_rate: branchData[branch].total_activity_rate.toFixed(2),
            data: branchData[branch].data,
          };
          response.push(branchResponse);
        } else {
          return res.status(404).json({ message: 'No data found for the given branch' });
        }
      } else {
        for (const branchId in branchData) {
          const branchInfo = masterBranches.find((branch) => branch.id === branchId);
          response.push({
            branch: branchInfo.branch_name,
            total_activity_rate: branchData[branchId].total_activity_rate.toFixed(2),
            data: branchData[branchId].data,
          });
          totalSumActivityRate += branchData[branchId].total_activity_rate;
        }
  
        response.unshift({ total_activity_rate: totalSumActivityRate.toFixed(2), Service_Type: "patient_advance" });
      }
  
      res.json(response);
    });
  };

  const bill_invoice = (req, res) => {
    const { branch, start, end, status, city, state } = req.query;
    const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
    const billInvoiceDataPath = 'datas/bill_invoices.json';
    const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  
    const branchData = {};
    const totalBranchSum = {};
  
    const fileStream = fs.createReadStream(billInvoiceDataPath, { encoding: 'utf8' });
    const jsonStream = JSONStream.parse('*');
  
    fileStream.pipe(jsonStream);
  
    jsonStream.on('data', (data) => {
      if (!data) {
        return;
      }
  
      const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
      const user = usersData.find((user) => user.id === data.patient_id);
      if (!branchId || !user) {
        return;
      }
  
      const branchInfo = masterBranches.find((branch) => branch.id === branchId);
  
      if (
        (!city || branchInfo.branch_city_id == city) &&
        (!state || branchInfo.branch_state_id == state)
      ) {
        if (!branchData[branchId]) {
          branchData[branchId] = { branch_total_amount: 0, data: [] };
        }
  
        const activityDate = new Date(data.invoice_date);
        if (
          (!start || activityDate >= new Date(start)) &&
          (!end || activityDate <= new Date(end))
        ) {
          branchData[branchId].branch_total_amount += parseFloat(data.total_amount);
          branchData[branchId].data.push({
            branch: branchId,
            branch_name: branchInfo.branch_name, 
            patient_id: data.patient_id,
            first_name: user.first_name || 'N/A',
            last_name: user.last_name || 'N/A',
            invoice_date: data.invoice_date,
            invoice_due_date: data.invoice_due_date,
            status: data.status,
            total_amount: data.total_amount,
          });
          if (!totalBranchSum[branchId]) {
            totalBranchSum[branchId] = 0.0;
          }
          totalBranchSum[branchId] += parseFloat(data.total_amount);
        }
      }
    });
  
    jsonStream.on('end', () => {
      const response = [];
  
  
        if (branch) {
          if (branchData[branch]) {
              const branchName = masterBranches.find((branchItem) => branchItem.id === branch).branch_name;
              response.push({
                  branch_name: branchName,
                  branch_total_amount: branchData[branch].branch_total_amount.toFixed(2),
                  data: branchData[branch].data,
              });
              const totalBranchSumValue = totalBranchSum[branch].toFixed(2);
              response.unshift({ branch_name: branchName, total_total_amount: totalBranchSumValue });
          } else {
              return res.status(404).json({ message: 'No data found for the given branch' });
          }
      } else {
        for (const branchId in branchData) {
          const branchInfo = masterBranches.find((branch) => branch.id === branchId);
          response.push({
            branch_name: branchInfo.branch_name, 
            total_total_amount: branchData[branchId].branch_total_amount.toFixed(2),
            data: branchData[branchId].data,
          });
        }
  
        const totalTotalAmount = Object.values(totalBranchSum)
          .reduce((sum, branch) => sum + parseFloat(branch), 0)
          .toFixed(2);
        response.unshift({ total_total_amount: totalTotalAmount });
      }
  
      res.json(response);
    });
  };
  
  const staff_extra_service = (req, res) => {
    const { branch, start, end, city, state } = req.query;
    const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
    const patientActivityDataPath = 'datas/patient_activity_staff_extra_service.json';
    const extraServiceData = JSON.parse(fs.readFileSync('datas/extra_service.json'));
    const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));

    const branchData = {};
    const totalBranchSum = {};

    const fileStream = fs.createReadStream(patientActivityDataPath, { encoding: 'utf8' });
    const jsonStream = JSONStream.parse('*');

    fileStream.pipe(jsonStream);

    jsonStream.on('data', (data) => {
        if (!data) {
            return;
        }

        const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id;
        if (!branchId) {
            return;
        }

        const branchInfo = masterBranches.find((branch) => branch.id === branchId);

        if (
            (!branch || branch === 'all' || branch === branchId) &&
            (!city || branchInfo.branch_city_id == city) &&
            (!state || branchInfo.branch_state_id == state)
        ) {
            if (!branchData[branchId]) {
                branchData[branchId] = { data: [] };
            }

            const extraServiceId = data.extra_service_id;
            const extraService = extraServiceData[extraServiceId] || { extra_service_name: 'N/A' };

            const activityDate = new Date(data.created_at);
            if ((!start || activityDate >= new Date(start)) && (!end || activityDate <= new Date(end))) {
                const extraServiceAmount = parseFloat(data.extra_service_amount);
                const extraServiceRate = parseFloat(data.extra_service_rate);

                if (extraServiceAmount > 0) {
                    branchData[branchId].data.push({
                        branch: branchId,
                        branch_name: branchInfo.branch_name,
                        patient_id: data.patient_id,
                        first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
                        last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
                        extra_service_amount: extraServiceAmount,
                        invoice_status: data.invoice_status,
                        payment_status: data.payment_status,
                        service: extraService.extra_service_name,
                    });

                    if (!totalBranchSum[branchId]) {
                        totalBranchSum[branchId] = 0.0;
                    }

                    totalBranchSum[branchId] += extraServiceAmount;
                }
            }
        }
    });

    jsonStream.on('end', () => {
        const response = [];

        for (const branchId in branchData) {
          const branchInfo = masterBranches.find((branch) => branch.id === branchId);
            const branchResponse = { branch_name: branchInfo ? branchInfo.branch_name : 'N/A', total_branch_staff_extra_amount: totalBranchSum[branchId], data: branchData[branchId].data };
            response.push(branchResponse);
        }

        let totalAllBranchAmount = 0;
        for (const branchId in totalBranchSum) {
            totalAllBranchAmount += totalBranchSum[branchId];
        }

        response.unshift({ total_branch_staff_extra_amount: totalAllBranchAmount.toFixed(2), service_Type: "Staff Extra service" });

        res.json(response);
    });
};

  const patient_activity_tax = (req, res) => {
    const { start, end, branch } = req.query;
    const patientActivityData = JSON.parse(fs.readFileSync('datas/patient_activity_staff_extra_service.json'));
  
    const branchData = {};
  
    patientActivityData.forEach((activity) => {
      const activityDate = new Date(activity.created_at);
      if (activityDate >= new Date(start) && activityDate <= new Date(end)) {
        const branchId = activity.branch_id || 'undefined';
        if (!branchData[branchId]) {
          branchData[branchId] = { total_tax_rate: 0, data: [] };
        }
  
        const taxRate = activity.tax_rate || 0;
        branchData[branchId].total_tax_rate += parseFloat(taxRate); 
        branchData[branchId].data.push({
          activity_id: activity.id,
          tax_rate: taxRate,
        });
      }
    });
  
    let response = [];
  
    if (!branch) {
      for (const branchId in branchData) {
        response.push({
          branch: branchId === 'undefined' ? 'All Branches' : branchId,
          total_tax_rate: branchData[branchId].total_tax_rate.toFixed(2),
          data: branchData[branchId].data,
        });
      }
    } else {
      if (branchData[branch]) {
        response.push({
          branch: branch,
          total_tax_rate: branchData[branch].total_tax_rate.toFixed(2),
          data: branchData[branch].data,
        });
      } else {
        return res.status(404).json({ message: 'No data found for the given branch' });
      }
    }
  
    const totalSumTaxRate = response.reduce((sum, branch) => sum + parseFloat(branch.total_tax_rate), 0).toFixed(2);
    response.unshift({ total_tax_rate: totalSumTaxRate });
  
    res.json(response);
  };
  
  const membership = (req, res) => {
    const { city, branch, state, start, end, status, invoice_status } = req.query;
    const patientsSchedulesDataPath = 'datas/patient_schedules.json';
    const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
    const masterBranchesData = JSON.parse(fs.readFileSync('datas/master_branches.json'));
  
    const branchData = {};
    let totalGrossRate = 0;
    let totalTaxRate = 0;
    let totalAmount = 0;
    let totalDiscountValue = 0;
  
    const fileStream = fs.createReadStream(patientsSchedulesDataPath, { encoding: 'utf8' });
    const jsonStream = JSONStream.parse('*');
  
    fileStream.pipe(jsonStream);
  
    jsonStream.on('data', (data) => {
      if (!data) {
        return;
      }
  
      const branchId = data.branch_id;
      const scheduleDate = new Date(data.schedule_date);
      const isWithinDateRange = (!start || scheduleDate >= new Date(start)) &&
        (!end || scheduleDate <= new Date(end));
      const isMatchingStatus = !status || data.status === status;
      const isMatchingInvoiceStatus = !invoice_status || data.invoice_status === invoice_status;
  
      let branchCity;
      let branchState;
  
      if (branchId) {
        const branchInfo = masterBranchesData.find(branchData => branchData.id === branchId);
        if (branchInfo) {
          branchCity = branchInfo.branch_city;
          branchState = branchInfo.branch_state;
        }
      }
  
      const isMatchingCity = !city || branchCity === city;
      const isMatchingBranch = !branch || branch === 'all' || branch === branchId;
      const isMatchingState = !state || branchState === state;
  
      if ((isMatchingCity || isMatchingBranch || isMatchingState) && isWithinDateRange && isMatchingStatus && isMatchingInvoiceStatus) {
        if (!branchData[branchId]) {
          branchData[branchId] = {
            total_gross_rate_branch: 0,
            total_tax_rate_branch: 0,
            total_amount_branch: 0,
            total_discount_value_branch: 0,
            data: [],
          };
        }
  
        const grossRate = parseFloat(data.gross_rate) || 0;
        const taxRate = parseFloat(data.tax_rate) || 0;
        const amount = parseFloat(data.amount) || 0;
        const discountValue = parseFloat(data.discount_value) || 0;
  
        branchData[branchId].total_gross_rate_branch += grossRate;
        branchData[branchId].total_tax_rate_branch += taxRate;
        branchData[branchId].total_amount_branch += amount;
        branchData[branchId].total_discount_value_branch += discountValue;
  
        totalGrossRate += grossRate;
        totalTaxRate += taxRate;
        totalAmount += amount;
        totalDiscountValue += discountValue;
  
        const user = usersData.find(user => user.id === data.user_id);
  
        branchData[branchId].data.push({
          patient_id: data.patient_id,
          user_id: data.user_id,
          first_name: user ? user.first_name : 'N/A',
          last_name: user ? user.last_name : 'N/A',
          schedule_date: data.schedule_date,
          lead_id: data.lead_id,
          status: data.status,
          invoice_status: data.invoice_status,
          branch_city: branchCity,
          branch_state: branchState,
        });
      }
    });
  
    jsonStream.on('end', () => {
      const response = [];
  
      for (const branchId in branchData) {
        response.push({
          branch: branchId,
          total_gross_rate_branch: branchData[branchId].total_gross_rate_branch.toFixed(2),
          total_tax_rate_branch: branchData[branchId].total_tax_rate_branch.toFixed(2),
          total_amount_branch: branchData[branchId].total_amount_branch.toFixed(2),
          total_discount_value_branch: branchData[branchId].total_discount_value_branch.toFixed(2),
          data: branchData[branchId].data,
        });
      }
  
      response.unshift({
        total_gross_rate_branch: totalGrossRate.toFixed(2),
        total_tax_rate_branch: totalTaxRate.toFixed(2),
        total_amount_branch: totalAmount.toFixed(2),
        total_discount_value_branch: totalDiscountValue.toFixed(2),
      });
  
      res.json(response);
    });
  };
  
  const getMedicalEmergencyCare = (req, res) => {
    const { branch, start, end, city, state } = req.query;
    const usersData = JSON.parse(fs.readFileSync('datas/users.json'));
    const patientEmergencyCareDataPath = 'datas/patient_activity_medical_emergency_care.json';
    const masterBranches = JSON.parse(fs.readFileSync('datas/master_branches.json'));
    const masterMedicalEmergency = JSON.parse(fs.readFileSync('datas/master_medical_emergency.json'));
  
    const branchData = {};
    const totalEmergencyCareAmount = {};
  
    const fileStream = fs.createReadStream(patientEmergencyCareDataPath, { encoding: 'utf8' });
    const jsonStream = JSONStream.parse('*');
  
    fileStream.pipe(jsonStream);
  
    jsonStream.on('data', (data) => {
      if (!data) {
        return;
      }
  
      const branchId = usersData.find((user) => user.id === data.patient_id)?.branch_id || 'undefined';
      const branchInfo = masterBranches.find((branch) => branch.id === branchId);
      const scheduleDate = new Date(data.schedule_date);
  
      const isWithinDateRange = (!start || scheduleDate >= new Date(start)) &&
        (!end || scheduleDate <= new Date(end));
      const isMatchingBranch = !branch || branch === branchId;
      const isMatchingCity = !city || branchInfo.branch_city_id == city;
      const isMatchingState = !state || branchInfo.branch_state_id == state;
  
      if (isWithinDateRange && isMatchingBranch && isMatchingCity && isMatchingState) {
        if (!branchData[branchId]) {
          branchData[branchId] = { total_emergency_care_amount: 0.0, data: [] };
        }
  
        const emergencyCareAmount = parseFloat(data.emergency_care_amount);
        if (!isNaN(emergencyCareAmount)) {
          branchData[branchId].total_emergency_care_amount += emergencyCareAmount;
          const emergencyCareId = data.emergency_care_id;
  
          const matchingMedicalEmergency = masterMedicalEmergency.find(
            (item) => item.id === emergencyCareId
          );
  
          branchData[branchId].data.push({
            branch: branchId,
            first_name: usersData.find((user) => user.id === data.patient_id)?.first_name || 'N/A',
            last_name: usersData.find((user) => user.id === data.patient_id)?.last_name || 'N/A',
            patient_id: data.patient_id,
            lead_id: data.lead_id,
            schedule_date: data.schedule_date,
            invoice_status: data.invoice_status,
            payment_status: data.payment_status,
            emergency_care_amount: emergencyCareAmount.toFixed(2),
            care_taken: matchingMedicalEmergency ? matchingMedicalEmergency.medical_emergency_name : 'N/A',
          });
  
          if (!totalEmergencyCareAmount[branchId]) {
            totalEmergencyCareAmount[branchId] = 0.0;
          }
          totalEmergencyCareAmount[branchId] += emergencyCareAmount;
        }
      }
    });
  
    jsonStream.on('end', () => {
      const response = [];
    
      masterBranches.forEach((branchInfo) => {
        const branchId = branchInfo.id;
        const branchTotalAmount = parseFloat(branchData[branchId]?.total_emergency_care_amount || 0);
    
        const dataForBranch = branchData[branchId]?.data || [];
    
        response.push({
          branch_name: branchInfo.branch_name,
          total_emergency_care_amount: (branchTotalAmount).toFixed(2),
          data: dataForBranch,
        });
      });
    
      let totalSum = 0.0;
      for (const branchId in totalEmergencyCareAmount) {
        totalSum += totalEmergencyCareAmount[branchId];
      }
    
      if (totalSum > 0 || response.length === 0) {
        response.unshift({ total_emergency_care_amount: totalSum.toFixed(2), service_Type: "Emergency Care" });
      }
    
      res.json(response);
    });
    
    
    
  };

module.exports = {
  bill_invoice,
  getConsolidatedBill,
  patient_activity_tax,
  membership,
  staff_extra_service,
  patient_advance,
  procedural_service,
  medical_equipments,
  fb,
  personal_care,
  getMedicalEmergencyCare,
};
