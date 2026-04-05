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

function getBackendAddress() {
  return getAccount().addr.toString();
}

async function optInToApp() {
  const account = getAccount();
  const appId = parseInt(process.env.POOL_APP_ID);

  const suggestedParams = await algodClient.getTransactionParams().do();

  const method = algosdk.ABIMethod.fromSignature("opt_in()void");
  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    appID: appId,
    method,
    methodArgs: [],
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams: suggestedParams,
    onComplete: algosdk.OnApplicationComplete.OptInOC,
  });

  const result = await atc.execute(algodClient, 20);
  return result.txIDs[0];
}

async function callPoolDeposit(amount) {
  const account = getAccount();
  const appId = parseInt(process.env.POOL_APP_ID);
  
  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature("deposit(uint64)uint64");
  
  const atc = new algosdk.AtomicTransactionComposer();
  
  atc.addMethodCall({
    appID: appId,
    method: method,
    methodArgs: [amount],
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams: suggestedParams,
  });
  
  const result = await atc.execute(algodClient, 20);
  
  return {
    txId: result.txIDs[0],
    sharesMinted: Number(result.methodResults[0].returnValue)
  };
}

async function callPoolWithdraw(shares) {
  const account = getAccount();
  const appId = parseInt(process.env.POOL_APP_ID);
  
  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature("withdraw(uint64)uint64");
  
  const atc = new algosdk.AtomicTransactionComposer();
  
  atc.addMethodCall({
    appID: appId,
    method: method,
    methodArgs: [shares],
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams: suggestedParams,
  });
  
  const result = await atc.execute(algodClient, 10);
  
  return {
    txId: result.txIDs[0],
    algoWithdrawn: Number(result.methodResults[0].returnValue)
  };
}

async function submitSignedAppCall(signedTxnBase64, expectedSender, expectedOnComplete) {
  const appId = parseInt(process.env.POOL_APP_ID);
  const signedBytes = Buffer.from(signedTxnBase64, "base64");
  const decoded = algosdk.decodeSignedTransaction(signedBytes);

  if (!decoded || !decoded.txn) {
    throw new Error("Invalid signed transaction");
  }

  const sender = decoded.txn.sender.toString();
  if (expectedSender && sender !== expectedSender) {
    throw new Error("Signed transaction sender mismatch");
  }

  if (decoded.txn.type !== "appl") {
    throw new Error("Signed transaction must be app call");
  }

  if (Number(decoded.txn.applicationCall?.appIndex ?? 0) !== appId) {
    throw new Error("Signed transaction app id mismatch");
  }

  if (expectedOnComplete !== undefined) {
    const onComplete = Number(decoded.txn.applicationCall?.onComplete ?? -1);
    if (onComplete !== Number(expectedOnComplete)) {
      throw new Error("Signed transaction onComplete mismatch");
    }
  }

  const response = await algodClient.sendRawTransaction(signedBytes).do();
  const txId = response.txid;
  await algosdk.waitForConfirmation(algodClient, txId, 20);
  return txId;
}

async function getPoolInfo() {
  const account = getAccount();
  const appId = parseInt(process.env.POOL_APP_ID);

  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature("get_pool()uint64");

  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    appID: appId,
    method: method,
    methodArgs: [],
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams: suggestedParams,
    staticCall: true,
  });

  const result = await atc.execute(algodClient, 10);

  return Number(result.methodResults[0].returnValue);
}

async function getTotalShares() {
  const account = getAccount();
  const appId = parseInt(process.env.POOL_APP_ID);

  const suggestedParams = await algodClient.getTransactionParams().do();
  const method = algosdk.ABIMethod.fromSignature("get_total_shares()uint64");

  const atc = new algosdk.AtomicTransactionComposer();

  atc.addMethodCall({
    appID: appId,
    method: method,
    methodArgs: [],
    sender: account.addr.toString(),
    signer: algosdk.makeBasicAccountTransactionSigner(account),
    suggestedParams: suggestedParams,
    staticCall: true,
  });

  const result = await atc.execute(algodClient, 10);

  return Number(result.methodResults[0].returnValue);
}

async function getUserShares(address) {
  const appId = parseInt(process.env.POOL_APP_ID);

  try {
    const info = await algodClient.accountApplicationInformation(address, appId).do();
    const localState = info.appLocalState || info["app-local-state"];
    const keyValues = localState?.keyValue || localState?.["key-value"] || [];

    const sharesEntry = keyValues.find((kv) => {
      const key = Buffer.from(kv.key, "base64").toString();
      return key === "shares";
    });

    if (!sharesEntry) return 0;
    const raw = sharesEntry.value?.uint ?? 0;
    return Number(raw);
  } catch (err) {
    if (String(err.message || "").includes("404")) return 0;
    throw err;
  }
}

module.exports = { 
  optInToApp,
  callPoolDeposit, 
  callPoolWithdraw, 
  submitSignedAppCall,
  getPoolInfo,
  getUserShares,
  getTotalShares,
  getAccount,
  getBackendAddress,
};
