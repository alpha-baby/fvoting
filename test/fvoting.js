const FVoting = artifacts.require("FVoting");

let one = true;
let instance = null;

let projectName = "test vote project1";
let t_now = parseInt((new Date()).getTime() / 1000);
let nowTime = parseInt(t_now);;
let endTime = t_now + 3600;
let weightPrice = 100000000000000;
let allWeight = 100000;
let candidates = ["test_person1", "test_person2", "test_person3"];
let candidatesBytes32 = [];

// 字符串转 utf-8 16进制
function strToHexCharCode(str) {
  if (str === "")
      return "";
  var hexCharCode = [];
  hexCharCode.push("0x");
  for (var i = 0; i < str.length; i++) {
      hexCharCode.push((str.charCodeAt(i)).toString(16));
  }
  return hexCharCode.join("");
}

contract("FVoting", accounts => {
  before(async () => {
    instance = await FVoting.deployed();
  });
  
  it("should be able to publish vote project", async () =>{
    //let instance = await FVoting.deployed();
    
    
    await candidates.forEach(element => {
        candidatesBytes32.push(strToHexCharCode(element));
    });

    await instance.createVoteProject(projectName, nowTime, endTime, weightPrice, allWeight, candidatesBytes32,{ from: accounts[0]});

    // 检查创建的投票项目是否为1个
    let voteProjectNumber = await instance.projectsIndex();
    assert.equal(voteProjectNumber, 1, "vote project number should be 1");
    // 检查刚刚创建的投票项目的名称是否为 ”test vote project1“
    let result = await instance.getVoteProjectInfo(1);
    assert.equal(result[3], projectName, "vote project name should be test vote project1!");
  });
  it("should be able to buy vote weight", async () => {
    let wantToBuy = 100;
    let weightPrice = 100000000000000;
    await instance.buyWeight(1, {from:accounts[0], value: wantToBuy*weightPrice});
    let result = await instance.getDetailsVotingInfo(1, accounts[0]);
    assert.equal(result[1], wantToBuy, "voter weight balance should be"+wantToBuy.toString());
  });
  it("should able to vote for candidate", async ()=>{
    let voteForCandidateName = strToHexCharCode(candidates[0]);
    let voteForWeight = 50;
    await instance.voteForCandidate(1, voteForCandidateName, voteForWeight);
    let result = await instance.getDetailsVotingInfo(1, accounts[0]);
    let weightBalance = 50;
    
    assert.equal(result[1], weightBalance, "voter weight balance should be "+weightBalance.toString());
    assert.equal(result[2][0], voteForWeight, "vote for candidate should be "+voteForWeight.toString());

    // 获取投票项目详细信息
    let voteProjectDetailsInfo = await instance.getVoteProjectDetailsInfo(1);
    assert.equal(voteProjectDetailsInfo[9],1 ,"voted number should be 1!");
    // 获取投票记录
    let record = await instance.getVoteRecord(1, 1);
    assert.equal(record[0], accounts[0], "voter should be "+accounts[0]);
    assert.equal(record[1], voteForWeight, "vote to weight should be "+voteForWeight.toString());
    
  });
  
});
