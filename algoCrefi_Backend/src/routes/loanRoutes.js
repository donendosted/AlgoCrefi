const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");
const loanController = require("../controllers/loanController");

router.post("/collateral/borrow", verifyToken, loanController.borrowCollateral);
router.post("/collateral/repay", verifyToken, loanController.repayCollateral);

router.post("/aura/borrow", verifyToken, loanController.borrowAura);
router.post("/aura/repay", verifyToken, loanController.repayAura);

router.get("/info", loanController.getLoanInfo);

module.exports = router;
