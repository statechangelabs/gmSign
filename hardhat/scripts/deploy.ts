import { spawnSync } from "child_process";
import { ethers, network } from "hardhat";
import type {} from "../typechain-types/@a16z/contracts/licenses/CantBeEvil";
async function main() {
  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  // const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const CBE = await ethers.getContractFactory("NonEvilToken");
  const intendedOwner = "0x47C0485Ac6392EeA8ae37BB469f485e8c0aCdd86";
  const index: number = 1;
  const cbe = await CBE.deploy(index, intendedOwner);

  await cbe.deployed();
  console.log("Deployed to address", cbe.address);
  ///let's verify
  let attempts = 0;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  while (attempts < 5) {
    try {
      const commandLine = `yarn hardhat verify ${cbe.address} ${index} ${intendedOwner} --network ${network.name}`;
      const result = spawnSync(commandLine, { stdio: "inherit", shell: true });
      if (result.status) {
        //check the output
        if (result.stderr.includes("does not have bytecode")) {
          //Patience, grasshopper
          console.log("Hit a failure with message", result.stderr);
          attempts++;
          await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
        }
      } else {
        console.log("That worked!!!", result);
        break;
      }
    } catch (e) {
      console.log("I hit an error", e);
      attempts++;
      console.log(e);
      await new Promise((resolve) => setTimeout(resolve, attempts * 1000));
    }
  }

  // console.log(
  //   `Lock with 1 ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
