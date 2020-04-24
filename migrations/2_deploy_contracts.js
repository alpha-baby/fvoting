// const ConvertLib = artifacts.require("ConvertLib");
// const MetaCoin = artifacts.require("MetaCoin");
const FVoting = artifacts.require("FVoting");

module.exports = function(deployer) {

  deployer.deploy(FVoting, "FVoting",{gas: 6720000});
  // deployer.deploy(Voting, ["0x416c696365", "0x426f62", "0x43617279"],{gas: 1000000});
  // deployer.deploy(DApp, 100000, web3.utils.toWei('0.01','ether'),["0x416c696365", "0x426f62", "0x43617279"],{gas: 2000000});
  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);
};
