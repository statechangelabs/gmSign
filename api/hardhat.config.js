// const { HardHatUserConfig } = require("hardhat/config");
// const dotenv = require("dotenv");
require("@nomicfoundation/hardhat-toolbox");
// require("hardhat-tracer");
// require("solidity-docgen");
// dotenv.config();
const config = {
  paths: {
    cache: "/tmp/cache",
    artifacts: "/tmp/artifacts",
    sources: "/tmp/sources",
  },
  solidity: "0.8.9",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    polygonMumbai: process.env.ALCHEMY_MUMBAI_KEY
      ? {
          url: process.env.ALCHEMY_MUMBAI_KEY,
          accounts: [process.env.METASIGNER_MUMBAI_PRIVATE_KEY || ""],
        }
      : undefined,
    polygon: process.env.ALCHEMY_POLYGON_KEY
      ? {
          url: process.env.ALCHEMY_POLYGON_KEY,
          accounts: [process.env.METASIGNER_POLYGON_PRIVATE_KEY || ""],
        }
      : undefined,
  },
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API || "",
      polygon: process.env.POLYGONSCAN_API || "",
    },
  },
  docgen: {
    exclude: ["reference-721/**/*.sol"],
  },
};
if (!config.networks.polygonMumbai) delete config.networks.polygonMumbai;
if (!config.networks.polygon) delete config.networks.polygon;
module.exports = config;
