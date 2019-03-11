const { Transaction } = require('@zilliqa-js/account');
const { BN, Long, bytes, units } = require('@zilliqa-js/util');
const { Zilliqa } = require('@zilliqa-js/zilliqa');
const CP = require ('@zilliqa-js/crypto');

const fs = require('fs');


const zilliqa = new Zilliqa('https://dev-api.zilliqa.com');

// These are set by the core protocol, and may vary per-chain.
// These numbers are JUST AN EXAMPLE. They will NOT WORK on the developer testnet
// or mainnet.
// For more information: https://apidocs.zilliqa.com/?shell#getnetworkid
const CHAIN_ID = 2;
const MSG_VERSION = 1;
const VERSION = bytes.pack(CHAIN_ID, MSG_VERSION);

// Populate the wallet with an account
const privatekey = '3375F915F3F9AE35E6B301B7670F53AD1A5BE15D8221EC7FD5E503F21D3450C8';

zilliqa.wallet.addByPrivateKey(
    privatekey
);


const main = async () => {
    
    try{
        const address = CP.getAddressFromPrivateKey(privatekey);
        console.log("Your account address is:");
        console.log(`0x${address}`);

        const balance = await zilliqa.blockchain.getBalance(address);
        console.log('Balance: ');
        console.log(balance.result);

        const minGasPrice = await zilliqa.blockchain.getMinimumGasPrice();
        console.log(`Current Minimum Gas Price: ${minGasPrice.result}`);
        const myGasPrice = units.toQa('1000', units.Units.Li); // Gas Price that will be used by all transactions
        console.log(`My Gas Price ${myGasPrice.toString()}`)
    
        //deploy contract
        const code = fs.readFileSync('./contract/ZRC20.scilla', 'utf8');
        const init = [

        {
            vname: "owner",
            type: "ByStr20",
            value: `0x${address}`
        },
        {
            vname: "symbol",
            type: "String",
            value: `XXX`
        },
        {
            vname: "decimals",
            type: "Uint128",
            value: 10
        },
        {
            vname: "_totalSupply",
            type: "ByStr20",
            value: 100000
        }
        ];

        const contract = zilliqa.contracts.new(code, init);
        const [deployTx, zrc20] = await contract.deploy({
            version: VERSION,
            gasPrice: myGasPrice,
            gasLimit: Long.fromNumber(10000)
        });

        console.log(`Deployment Transaction ID: ${deployTx.id}`);
        console.log(`Deployment Transaction Receipt:`);
        console.log(deployTx.receipt);

        // Get the deployed contract address
        console.log("The contract address is:");
        console.log(zrc20.address);
        const callTx = await zrc20.call(
        "totalSupply",
        [],
        {
            version: VERSION,
            amount: new BN(0),
            gasPrice: myGasPrice,
            gasLimit: Long.fromNumber(8000),
        }
        );

        console.log(callTx);

    }catch(err){
        console.log(err);
    }
    
}

main();