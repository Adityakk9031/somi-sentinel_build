require('dotenv').config();
console.log('Environment Variables Test:');
console.log('SOMNIA_RPC:', process.env.SOMNIA_RPC);
console.log('SOMNIA_CHAIN_ID:', process.env.SOMNIA_CHAIN_ID);
console.log('DEPLOYER_PRIVATE_KEY exists:', !!process.env.DEPLOYER_PRIVATE_KEY);
console.log('DEPLOYER_PRIVATE_KEY length:', process.env.DEPLOYER_PRIVATE_KEY ? process.env.DEPLOYER_PRIVATE_KEY.length : 0);


