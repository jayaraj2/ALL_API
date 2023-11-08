// async function createDataDirectory() {
//     if (!existsSync(path.join(__dirname, 'datas'))) {
//       try {
//         await fs.mkdir(path.join(__dirname, 'datas'));
//         console.log("Folder has been created in this project!");
//       } catch (err) {
//         console.error('Error creating the directory:', err);
//       }
//     } else {
//       console.log("Folder already in this project!");
//     }
//   }
  
//   createDataDirectory();
  
  
//   var patients = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id, branch_id, first_name, last_name, gender FROM patients', (err, result) => {
//       if (err) {
//         console.error('Error querying patients:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'users.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log('Patients data has been saved into JSON with a 1-second interval');
//         }
//       });
//     });
//   });
  
//   var activity = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id, patient_id, lead_id, schedule_date, schedule_id, activity_rate, invoice_status, created_at, activity_category FROM patient_activity_advance', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_advance.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_advance data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
//   var fb = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,fb_rate,fb_amount,tax_rate,invoice_status,created_at FROM patient_activity_fb', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_fb.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_fb data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
//   var emer = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,emergency_care_rate,emergency_care_amount,tax_rate,invoice_status,created_at FROM patient_activity_medical_emergency_care', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_fb.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_medical_emergency_care data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
  
  
//   var personal = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,personal_care_rate,personal_care_amount,tax_rate,invoice_status,created_at FROM patient_activity_personal_care_service', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_personal_care_service.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_personal_care_service data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
  
//   var eqp = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,medical_equipment_rate,medical_equipment_amount,tax_rate,invoice_status,created_at FROM patient_activity_medical_euipments', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_medical_euipments.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_medical_euipments data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
  
  
//   var pro = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,procedure_service_rate,procedure_service_amount,tax_rate,invoice_status,created_at FROM patient_activity_procedure_service', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_procedure_service.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_procedure_service data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
  
//   var extra = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,patient_id,lead_id,schedule_id,schedule_date,extra_service_rate,extra_service_amount,tax_rate,invoice_status,created_at FROM patient_activity_staff_extra_service', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_activity_staff_extra_service.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_activity_staff_extra_service data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
  
//   var extra = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,user_id,patient_id,lead_id,invoice_type,invoice_no,invoice_date,invoice_due_date,total_amount,status,consolidated_bill_no,created_at FROM bill_invoices', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'bill_invoices.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("bill_invoices data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
//   patients.start();
//   activity.start();
//   fb.start();
//   emer.start();
//   personal.start();
//   eqp.start();
//   pro.start();
//   extra.start();
  
  
//   var schedules = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,user_id,patient_id,bed_id,membership_id,gross_rate,tax_rate,membership_type,amount,ratecard_id,status,invoice_status FROM patient_schedules', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'patient_schedules.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("patient_schedules data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
//   schedules.start();
  
  
//   var branches = cron.schedule("*/1 * * * * *", function () {
//     pool.query('SELECT id,branch_name,branch_code,branch_state_id,branch_city_id FROM `master_branches`', (err, result) => {
//       if (err) {
//         console.error('Error querying activity:', err);
//         return;
//       }
//       fs.writeFile(path.join('datas', 'master_branches.json'), JSON.stringify(result), function (err) {
//         if (err) {
//           console.error('Error saving data:', err);
//         } else {
//           console.log("master_branches data has been saved into the file with a 1-second interval");
//         }
//       });
//     });
//   });
  
//   branches.start();