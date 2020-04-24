pragma solidity >0.5.0;

contract FVoting{
    string                      public   contractName;
    address                     public   publishAddr;
    mapping(uint=>VoteProject)  public   projectsMap;
    uint                        public   projectsIndex;
    
    // uint public totalTokens;
    // uint public tokenBalance;
    // uint public tokenPrice;
    
    // bytes32[] public candidateList;
    // mapping(bytes32 => uint) public votesReceived;
    // mapping(address => Voter) public voterInfo;
    
    struct VoteProject {
        address                   publishAddr;
        uint                      startTime;
        uint                      endTime;
        string                    name;
        uint                      allWeight;
        uint                      weightBalance;
        uint                      weightPrice;
        uint                      votedNumber;
        bytes32[]                 candidates;
        uint[]                    candidateReceive;
        mapping(uint=>VoteRecord) voted;
        mapping(address=>Voter)   voterInfo;
    }
    
    
    struct Voter {
        address voterAddress;
        uint    weightBalance;
        uint[]  weightForCandidate;
    }
    
    struct VoteRecord {
        address     voterAddr;
        uint        weight;
        bytes32     votedName;
        uint        voteTime;
    }
    //构造函数
    constructor(string memory name) public {
        contractName = name;
        projectsIndex = 0;
        publishAddr = address(msg.sender);
    }

    // 获取投票项目信息
    function getVoteProjectInfo(uint projectIndex) view public returns(
        address,
        uint,
        uint,
        string memory) {
        require(projectIndex > 0, "out of index!");
        require(projectIndex <= projectsIndex, "out of index!");
        
        VoteProject memory vPro = projectsMap[projectIndex];
        string memory vProName = vPro.name;
        return (vPro.publishAddr, vPro.startTime, vPro.endTime, vProName);
    }
    // 获取投票项目详细信息
    function getVoteProjectDetailsInfo(uint projectIndex) view public returns(
        address,
        uint,
        uint,
        string memory,
        uint,
        uint,
        uint,
        uint[] memory,
        bytes32[] memory,
        uint) {
        require(projectIndex > 0, "out of index!");
        require(projectIndex <= projectsIndex, "out of index!");
        
        VoteProject storage vPro = projectsMap[projectIndex];
        return (vPro.publishAddr, 
        vPro.startTime, 
        vPro.endTime, 
        vPro.name, 
        vPro.allWeight,
        vPro.weightBalance,
        vPro.weightPrice,
        vPro.candidateReceive,
        vPro.candidates,
        vPro.votedNumber);
    }
    // 获取某个投票项目的投票记录
    function getDetailsVotingInfo(uint projectIndex, address VoterAddr) view public returns(address, uint, uint[] memory) {
        require(projectIndex > 0, "out of index!");
        require(projectIndex <= projectsIndex, "out of index!");
        
        VoteProject storage vPro = projectsMap[projectIndex];
        Voter storage _info = vPro.voterInfo[VoterAddr];
        return (_info.voterAddress, _info.weightBalance, _info.weightForCandidate);
    }
    
    // 创建投票项目 
    function createVoteProject(
    string memory name, 
    uint _startTime, 
    uint _endTime, 
    uint _weightPrice,
    uint _allWeight,
    bytes32[] memory _candidates) public {
        uint candidateNumber = _candidates.length;
        uint[] memory candidateReceiveInit = new uint[](candidateNumber);
        for ( uint i=0;i<candidateNumber;i++) {
            candidateReceiveInit[i] = 0;
        }
        projectsIndex++;
        projectsMap[projectsIndex] = VoteProject(
            {
                publishAddr: msg.sender,
                startTime: _startTime,
                endTime: _endTime,
                name: name,
                weightPrice: _weightPrice,
                weightBalance: _allWeight,
                allWeight: _allWeight,
                votedNumber: 0,
                candidates: _candidates,
                candidateReceive: candidateReceiveInit
            });
    }
    
    //购买投票权重
    function buyWeight(uint voteProIndex) payable public returns(uint) {
        require(voteProIndex <= projectsIndex, "vote project not exists!");
        VoteProject storage vPro = projectsMap[voteProIndex];
        uint weightsToBuy = msg.value / vPro.weightPrice;
        require(weightsToBuy <= vPro.weightBalance, "vote project weight balance is not enough!");
        vPro.voterInfo[msg.sender].voterAddress = msg.sender;
        vPro.voterInfo[msg.sender].weightBalance += weightsToBuy;
        uint oldBalance = vPro.weightBalance;
        vPro.weightBalance -= weightsToBuy;
        require(vPro.weightBalance + weightsToBuy == oldBalance, "buy weihgt callback check error!");
        return weightsToBuy;
    }
    
    // 给某个选举人投票
    function voteForCandidate(uint voteProIndex, bytes32 candidateName, uint voteWeight) public {
        require(voteProIndex > 0, "vote project not exists!");
        require(voteProIndex <= projectsIndex, "vote project not exists!");
        VoteProject storage vPro = projectsMap[voteProIndex];
        
        uint index = indexOfCandidate(vPro.candidates, candidateName);
        require(index != uint(-1), "candidate not exists!");
        // 检查这个投票项目是否已经开始了
        require(block.timestamp >= vPro.startTime, "the vote project not begin!");
        
        // 检查这个投票项目是否已经结束了
        require(block.timestamp <= vPro.endTime, "the vote project has over!");
        
        if (vPro.voterInfo[msg.sender].weightForCandidate.length == 0) {
            for (uint i=0; i < vPro.candidates.length; i++) {
                vPro.voterInfo[msg.sender].weightForCandidate.push(0);
            }
        }
        
        uint availableTokens = vPro.voterInfo[msg.sender].weightBalance;
        require(availableTokens >= voteWeight, "your token not enough!");
        vPro.candidateReceive[index] += voteWeight;
        vPro.voterInfo[msg.sender].weightBalance -= voteWeight;
        vPro.voterInfo[msg.sender].weightForCandidate[index] += voteWeight;

        // 增加投票记录
        vPro.votedNumber++;
        vPro.voted[vPro.votedNumber] = VoteRecord({
            voterAddr: msg.sender,
            weight: voteWeight,
            votedName: candidateName,
            voteTime: block.timestamp
        });
    }
    
    function getVoteRecord(uint voteProIndex, uint recordIndex) public view returns(address,uint,bytes32,uint) {
        require(voteProIndex > 0, "vote project not exists!");
        require(voteProIndex <= projectsIndex, "vote project not exists!");
        VoteProject storage vPro = projectsMap[voteProIndex];
        require(recordIndex <= vPro.votedNumber, "recordIndex must be");
        VoteRecord storage record = vPro.voted[recordIndex];
        return (record.voterAddr, record.weight,record.votedName, record.voteTime);
    }
    
    function indexOfCandidate(bytes32[] memory candidateList, bytes32 candidate) internal pure returns(uint) {
        for (uint i=0; i<candidateList.length; i++) {
            if (candidateList[i] == candidate) {
                return i;
            }
        }
        return uint(-1);
    }
    // 提取合约以太
    function transfer() public {
        require(msg.sender == publishAddr, "must be publisher!");
        msg.sender.transfer(address(this).balance);
        //_to.transfer(address(this).balance);
    }
}
