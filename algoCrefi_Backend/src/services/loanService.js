const algosdk = require("algosdk");
require("dotenv").config();

const algodClient = new algosdk.Algodv2(
  process.env.ALGOD_TOKEN || "",
  process.env.ALGOD_SERVER || "https://testnet-api.algonode.cloud",
  process.env.ALGOD_PORT || ""
);

function getAccount() {
  return algosdk.mnemonicToSecretKey(process.env.MNEMONIC);
}

async function executeMethodCall({ appId, methodSignature, methodArgs }) {
  const account = getAccount();
  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature(methodSignature);

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: Number(appId),
    method,
    methodArgs,
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams,
  });

  const result = await atc.execute(algodClient, 20);
  return {
    txId: result.txIDs[0],
    returnValue: result.methodResults[0].returnValue,
  };
}

async function executeReadonlyCall({ appId, methodSignature, methodArgs = [] }) {
  const account = getAccount();
  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature(methodSignature);

  const atc = new algosdk.AtomicTransactionComposer();
  atc.addMethodCall({
    appID: Number(appId),
    method,
    methodArgs,
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams,
    staticCall: true,
  });

  const result = await atc.execute(algodClient, 20);
  return result.methodResults[0].returnValue;
}

async function collateralBorrow(amount, collateralAmount) {
  const appId = Number(process.env.LENDING_APP_ID);
  const result = await executeMethodCall({
    appId,
    methodSignature: "borrow(uint64,uint64)void",
    methodArgs: [Number(amount), Number(collateralAmount)],
  });
  return { txId: result.txId };
}

async function collateralRepay(amount) {
  const appId = Number(process.env.LENDING_APP_ID);
  const result = await executeMethodCall({
    appId,
    methodSignature: "repay(uint64)void",
    methodArgs: [Number(amount)],
  });
  return { txId: result.txId };
}

async function getCollateralLoanState() {
  const appId = Number(process.env.LENDING_APP_ID);
  const loan = await executeReadonlyCall({
    appId,
    methodSignature: "get_loan()uint64",
  });

  return Number(loan);
}

async function auraBorrow(amount) {
  const appId = Number(process.env.AURA_APP_ID);
  const result = await executeMethodCall({
    appId,
    methodSignature: "mint(uint64)void",
    methodArgs: [Number(amount)],
  });
  return { txId: result.txId };
}

async function auraRepay(amount) {
  const appId = Number(process.env.AURA_APP_ID);
  const result = await executeMethodCall({
    appId,
    methodSignature: "burn(uint64)void",
    methodArgs: [Number(amount)],
  });
  return { txId: result.txId };
}

async function getAuraSupply() {
  const appId = Number(process.env.AURA_APP_ID);
  const totalSupply = await executeReadonlyCall({
    appId,
    methodSignature: "get_total_supply()uint64",
  });

  return Number(totalSupply);
}

module.exports = {
  collateralBorrow,
  collateralRepay,
  getCollateralLoanState,
  auraBorrow,
  auraRepay,
  getAuraSupply,
};
