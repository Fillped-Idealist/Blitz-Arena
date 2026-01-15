// 测试前端与合约的交互
// 通过 curl 模拟前端的合约调用

const deployment = require("../deployments/deployment.json");

console.log("=== 测试前端与合约交互 ===\n");

console.log("1. 测试 getAllGames");
const getAllGamesCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"${deployment.gameFactory}","data":"0xdb1c45f9"},"latest"],"id":1}' http://127.0.0.1:8545`;
console.log(`   命令: ${getAllGamesCmd}\n`);

console.log("2. 测试 getTotalGames");
const getTotalGamesCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_call","params":[{"to":"${deployment.gameFactory}","data":"0x0c31d26e"},"latest"],"id":1}' http://127.0.0.1:8545`;
console.log(`   命令: ${getTotalGamesCmd}\n`);

console.log("3. 测试 GameInstance 合约代码");
const getGameCodeCmd = `curl -s -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["${deployment.gameFactory}","latest"],"id":1}' http://127.0.0.1:8545`;
console.log(`   命令: ${getGameCodeCmd}\n`);

console.log("\n=== 请在终端中执行以下命令来验证 ===\n");
console.log(getAllGamesCmd);
console.log(getTotalGamesCmd);
console.log(getGameCodeCmd);

console.log("\n=== 预期结果 ===\n");
console.log("✅ getAllGames: 返回比赛地址列表（至少 1 个）");
console.log("✅ getTotalGames: 返回比赛总数（至少 1）");
console.log("✅ eth_getCode: 返回合约代码（长度 > 0）");

console.log("\n=== 前端测试清单 ===\n");
console.log("1. 访问 http://localhost:5000");
console.log("2. 连接 MetaMask 到 Hardhat Local 网络");
console.log("3. 导入测试账户：0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
console.log("4. 刷新页面");
console.log("5. 查看比赛列表（应该显示已创建的测试比赛）");
console.log("6. 创建新比赛");
console.log("7. 参加比赛");
console.log("8. 提交分数");
console.log("9. 查看排行榜");
