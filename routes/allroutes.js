const app = require("express");
const router = app.Router();

const Report = require("../controllers/reports");

router.post("/consolidated_bill", Report.getConsolidatedBill);
router.post("/fb", Report.fb);
router.post("/patient_advance", Report.patient_advance);
router.post("/personal_care", Report.personal_care);
router.post("/procedural_service", Report.procedural_service);
router.post("/medical_equipemts", Report.medical_equipemts);
// router.post("/membership", Report.membership);
router.post("/patient_activity_tax", Report.patient_activity_tax);
router.post("/staff_extra_service", Report.staff_extra_service);
router.post("/bill_invoice", Report.bill_invoice);
router.post("/emergency_care", Report.getMedicalEmergencyCare);

module.exports = router;
