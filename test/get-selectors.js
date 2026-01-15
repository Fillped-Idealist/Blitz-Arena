// 计算函数选择器
const { keccak256, toUtf8Bytes } = require("ethers");

const functionName = "getTotalGames()";
const selector = keccak256(toUtf8Bytes(functionName)).slice(0, 10);
console.log(`Function: ${functionName}`);
console.log(`Selector: 0x${selector}`);

// 其他常用函数
const functions = [
  "getAllGames()",
  "getTotalGames()",
  "getPartofGames(uint256,uint256)",
  "createGame((string,string,uint8,address,uint256,uint256,uint256,uint256,uint256,address,uint256,uint8,uint256[]))",
  "withdrawFees(address)",
];

console.log("\n所有函数选择器：");
functions.forEach(fn => {
  const sel = keccak256(toUtf8Bytes(fn)).slice(0, 10);
  console.log(`  ${fn}: 0x${sel}`);
});
