const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  // 常见的可能字符串
  const possibleStrings = [
    'GAME_ROLE',
    'ADMIN_ROLE',
    'CREATOR_ROLE',
    'PLATFORM_ROLE',
    'OWNER_ROLE',
    'GAME',
    'ADMIN',
    'CREATOR',
    'PLATFORM',
    'OWNER',
    'GAME_FACTORY',
    'GAME_INSTANCE',
  ];

  console.log("Hashing possible strings...\n");
  const hashes = {};
  possibleStrings.forEach(str => {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(str));
    hashes[hash] = str;
    console.log(`${str}: ${hash}`);
  });

  // 错误信息中的哈希值
  const errorHash = '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775';
  console.log(`\nLooking for: ${errorHash}`);
  if (hashes[errorHash]) {
    console.log(`Found matching string: ${hashes[errorHash]}`);
  } else {
    console.log("No matching string found in the list");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
