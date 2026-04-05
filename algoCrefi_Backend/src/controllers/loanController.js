const {
  collateralBorrow,
  collateralRepay,
  getCollateralLoanState,
  auraBorrow,
  auraRepay,
  getAuraSupply,
} = require("../services/loanService");

exports.borrowCollateral = async (req, res) => {
  try {
    const { amount, collateralAmount } = req.body;

    if (!amount || !collateralAmount) {
      return res.status(400).json({
        success: false,
        error: "amount and collateralAmount are required",
      });
    }

    const result = await collateralBorrow(Number(amount), Number(collateralAmount));

    res.json({
      success: true,
      message: "Collateral-based borrow submitted",
      txId: result.txId,
      loanType: "collateral",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.repayCollateral = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "amount is required" });
    }

    const result = await collateralRepay(Number(amount));

    res.json({
      success: true,
      message: "Collateral-based repay submitted",
      txId: result.txId,
      loanType: "collateral",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.borrowAura = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "amount is required" });
    }

    const result = await auraBorrow(Number(amount));

    res.json({
      success: true,
      message: "Aura-based borrow submitted",
      txId: result.txId,
      loanType: "non-collateral",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.repayAura = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "amount is required" });
    }

    const result = await auraRepay(Number(amount));

    res.json({
      success: true,
      message: "Aura-based repay submitted",
      txId: result.txId,
      loanType: "non-collateral",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLoanInfo = async (_req, res) => {
  try {
    const [collateralLoan, auraSupply] = await Promise.all([
      getCollateralLoanState(),
      getAuraSupply(),
    ]);

    res.json({
      success: true,
      lending: {
        appId: Number(process.env.LENDING_APP_ID),
        loan: collateralLoan,
      },
      aura: {
        appId: Number(process.env.AURA_APP_ID),
        totalSupply: auraSupply,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
