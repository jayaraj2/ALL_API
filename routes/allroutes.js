const app = require("express");
const router = app.Router();

const Report = require("../controllers/reports");
const branch = require("../controllers/branch");

router.post("/consolidated_bill", Report.getConsolidatedBill);
router.post("/fb", Report.fb);
router.post("/patient_advance", Report.patient_advance);
router.post("/personal_care", Report.personal_care);
router.post("/procedural_service", Report.procedural_service);
router.post("/medical_equipemts", Report.medical_equipments);
// router.post("/membership", Report.membership);
router.post("/patient_activity_tax", Report.patient_activity_tax);
router.post("/staff_extra_service", Report.staff_extra_service);
router.post("/bill_invoice", Report.bill_invoice);
router.post("/emergency_care", Report.getMedicalEmergencyCare);
router.post("/tax", Report.tax);


// -------------------------------Branch-------------------------------- //

router.post("/city", branch.city);
router.post("/state", branch.state);
router.post("/branches", branch.branches);



module.exports = router;
