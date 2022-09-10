import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
dotenv.config();
const config: HardhatUserConfig = {
  solidity: "0.8.13",
  networks: {
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_KEY,
      accounts: [process.env.MUMBAI_PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: {
      polygonMumbai:
        process.env.MUMBAI_ETHERSCAN_KEY ||
        "S5K4GZ69KHVTMUV6JISJ7VZ5GHUKQZ64N6",
    },
  },
};

export default config;
