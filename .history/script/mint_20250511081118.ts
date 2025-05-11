import {
    CIP68_222,
    stringToHex,
    mConStr0,
    CIP68_100,
    metadataToCip68,
    deserializeAddress,
    MeshTxBuilder,
    applyParamsToScript,
    resolveScriptHash,
    serializeAddressObj,
    serializePlutusScript,
    scriptAddress,
    BrowserWallet
  } from "@meshsdk/core";
  import plutus from './plutus.json';
  import {wallet, getWalletInfoForTx, blockchainProvider } from './common';
  const PLATFORM_FEE = '1000000';
  const DEFAULT_EXCHANGE_ADDRESS = "addr_test1qpwhc8r32ve7cp6ydnephfmvvrufztxjwm78cv9x87v8mmea5c3gnmvgpy05ecnqzp4f8wjw8mx0nl78sfpyrxa88pks0pgk5z";
  function readValidator(title: string): string {
    const validator = plutus.validators.find(v => v.title === title);
    if (!validator) throw new Error(`${title} validator not found.`);
    return validator.compiledCode;
  }
  
  
  export async function mintNFT(
    wallet: any, 
    tokenName: string,
    metadata: any,
    options?: {
      platformFee?: string,
      exchangeAddress?: string
    }
  ) {
    try {
      const m
      // Settings
      const platformFee = options?.platformFee || PLATFORM_FEE;
      const exChange = options?.exchangeAddress || DEFAULT_EXCHANGE_ADDRESS;
      console.log("Exchange address: ", exChange);
      // Setup
      const { utxos, walletAddress, collateral } = await getWalletInfoForTx(wallet);
      const { pubKeyHash: userPubKeyHash } = deserializeAddress(walletAddress);
      const pubkeyExchange = deserializeAddress(exChange).pubKeyHash;
      console.log("Exchange address: ", exChange);
      // Get validator scripts
      const mintCompilecode = readValidator("mint.mint.mint");
      const storeCompilecode = readValidator("store.store.spend");
      
      // Setup script addresses
      const storeScriptCbor = applyParamsToScript(storeCompilecode, [pubkeyExchange, BigInt(1), userPubKeyHash]);
      const storeScript = {
        code: storeScriptCbor,
        version: "V3" as const,
      };
 //     console.log("Store ScriptCbor : ", storeScriptCbor);

      const storeAddress = serializeAddressObj(
        scriptAddress(
          deserializeAddress(serializePlutusScript(storeScript, undefined, 0, false).address).scriptHash,
          deserializeAddress(exChange).stakeCredentialHash,
          false,
        ),
        0,
      );
      //console.log("Store adress: ", storeAddress);
      
      // Create transaction builder
      const txBuilder = new MeshTxBuilder({
        fetcher: blockchainProvider,
        submitter: blockchainProvider
      });
      
      // Calculate script hashes and policy ID
      const storeScriptHash = deserializeAddress(storeAddress).scriptHash;
      const mintScriptCbor = applyParamsToScript(mintCompilecode, [
        pubkeyExchange,
        BigInt(1),
        storeScriptHash,
        deserializeAddress(exChange).stakeCredentialHash,
        userPubKeyHash,
      ]);
      
      const policyId = resolveScriptHash(mintScriptCbor, "V3");
      const hexAssetName = stringToHex(tokenName);
      
      // Start building transaction
      const unsignedTx = txBuilder.mintPlutusScriptV3();
      
      // Build the transaction
      unsignedTx
        .mint("1", policyId, CIP68_222(hexAssetName))
        .mintingScript(mintScriptCbor)
        .mintRedeemerValue(mConStr0([]))
        .mintPlutusScriptV3()
        .mint("1", policyId, CIP68_100(hexAssetName))
        .mintingScript(mintScriptCbor)
        .mintRedeemerValue(mConStr0([]))
        .txOut(storeAddress, [
          {
            unit: policyId + CIP68_100(hexAssetName),
            quantity: "1"
          }
        ])
        .txOutInlineDatumValue(metadataToCip68(metadata))
        .txOut(walletAddress, [
          {
            unit: policyId + CIP68_222(hexAssetName),
            quantity: "1"
          },   
        ])
        .txOut(exChange, [
          {
            unit: "lovelace",
            quantity: "1000000"
          }
        ])
        .changeAddress(walletAddress)
        .requiredSignerHash(userPubKeyHash)
        .selectUtxosFrom(utxos)
        .txInCollateral(
          collateral.input.txHash, 
          collateral.input.outputIndex, 
          collateral.output.amount, 
          collateral.output.address
        )
        .setNetwork("preview")
        .addUtxosFromSelection();

      const completedTx = await unsignedTx.complete();
      const signedTx = await wallet.signTx(completedTx, true);
      const txHash = await wallet.submitTx(signedTx);
      
      return txHash;
    } catch (error) {
      console.error("Mint error:", error);
      throw error;
    }
  }
  
  