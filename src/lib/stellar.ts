import * as StellarSdk from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

export async function getBalance(publicKey: string): Promise<string> {
  const account = await server.loadAccount(publicKey);
  const native = account.balances.find(
    (b) => b.asset_type === "native"
  );
  return native ? native.balance : "0";
}

export async function sendPayment(
  senderPublicKey: string,
  destinationAddress: string,
  amount: string,
  signTransaction: (xdr: string, opts: { networkPassphrase: string }) => Promise<string>
): Promise<string> {
  const account = await server.loadAccount(senderPublicKey);
  const fee = await server.fetchBaseFee();

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: fee.toString(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination: destinationAddress,
        asset: StellarSdk.Asset.native(),
        amount: amount,
      })
    )
    .setTimeout(30)
    .build();

  const xdr = transaction.toXDR();
  const signedXdr = await signTransaction(xdr, {
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    NETWORK_PASSPHRASE
  );

  const result = await server.submitTransaction(signedTransaction);
  return result.hash;
}

export async function fundWithFriendbot(publicKey: string): Promise<void> {
  const response = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
  );
  if (!response.ok) {
    const text = await response.text();
    if (!text.includes("createAccountAlreadyExist")) {
      throw new Error("Failed to fund account with Friendbot");
    }
  }
}
