pragma solidity >=0.4.21 <0.7.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/FVoting.sol";

contract TestFVoting {
    uint public initialBalance = 10 ether;
    function testInitialBalanceUsingDeployedContract() public {
        FVoting voting = FVoting(DeployedAddresses.FVoting());

        uint expected = 100000;

        Assert.equal(
            voting.totalTokens(),
            expected,
            "total tokens should be 10000"
        );
    }

    function testBuyTokens() public {
        //MetaCoin meta = new MetaCoin();
        FVoting voting = FVoting(DeployedAddresses.FVoting());
        uint expected = 99900;
        voting.buy.value(1 ether)();
        Assert.equal(
            voting.tokenBalance(),
            expected,
            "tokenBalance should be 99900"
        );
    }
}
