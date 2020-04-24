import $ from "jquery";
import Web3 from "web3";
import Voting_artifacts from "../../build/contracts/FVoting.json";
import "open-iconic/font/css/open-iconic-bootstrap.css";
import "bootstrap/dist/css/bootstrap.css";
import "./FVoting.css";




let candidates = {};
let weightPrice = null;
let weightBalance = null;
let projectNumber = null;
let currentProjectIndex = null;
let pubAddr = "";
let recordNumber = null;

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

const App = {
    web3: null,
    account: null,
    contractAddr: null,
    meta: null,

    start: async function () {
        const { web3 } = this;

        try {
            // get contract instance
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = Voting_artifacts.networks[networkId];
            console.log("deployedNetwork")
            console.log(deployedNetwork)
            this.meta = new web3.eth.Contract(
                Voting_artifacts.abi,
                deployedNetwork.address,
            );

            // get accounts
            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];
            this.contractAddr = deployedNetwork.address;


        } catch (error) {
            console.error("Could not connect to contract or chain.");
        }
    },
    refresh: async function () {
        let pubName = await this.contractName();
        pubAddr = await this.publishAddr();
        projectNumber = await this.projectsIndex();
        currentProjectIndex = projectNumber;
        $("#contractPublishName").append("<strong>" + pubName + "</strong>");
        $("#DAppName-title").html(pubName);
        if (currentProjectIndex > 0) {
            let result = await this.getVoteProjectDetailsInfo(currentProjectIndex);
            console.log("record number is ", result[9]);
            recordNumber = result[9];
        }
    },
    contractName: async function () {
        const { contractName } = this.meta.methods;
        let name = await contractName().call();
        return name;
    },
    publishAddr: async function () {
        const { publishAddr } = this.meta.methods;
        let pubAddr = await publishAddr().call();
        return pubAddr;
    },
    projectsIndex: async function () {
        const { projectsIndex } = this.meta.methods;
        let projectNumber = await projectsIndex().call();
        return projectNumber;
    },
    createVoteProject: async function (i1,i2,i3,i4,i5,i6) {
        const { createVoteProject } = this.meta.methods;
        let projectName = i1;
        let nowTime = i2;
        let endTime = i3;
        let weightPrice = this.web3.utils.toWei(i4, 'ether');
        let allWeight = i5;
        let candidates = i6;
        let candidatesBytes32 = [];
        await candidates.forEach(element => {
            candidatesBytes32.push(this.web3.utils.fromUtf8(element));
        });

        console.log(candidatesBytes32);

        await createVoteProject(projectName, nowTime, endTime, weightPrice, allWeight, candidatesBytes32)
            .send({ from: this.account});
    },
    getVoteProjectInfo: async function (projectIndex) {
        console.log("query projectIndex: ", projectIndex);
        const { getVoteProjectInfo } = this.meta.methods;
        let result = await getVoteProjectInfo(projectIndex).call();
        if (result[0] != 0) {
            return result;
        }
        return [];
    },
    getDetailsVotingInfo: async function(projectIndex, accountAddr) {
        const { getDetailsVotingInfo } = this.meta.methods;
        let result = await getDetailsVotingInfo(projectIndex, accountAddr).call(); 
        return result;
    },
    getVoteProjectDetailsInfo: async function(projectIndex) {
        const { getVoteProjectDetailsInfo } = this.meta.methods;
        let result = await getVoteProjectDetailsInfo(projectIndex).call(); 
        return result;
    },
    buyWeight: async function(projectIndex, weightPrice, voteWeight) {
        const { buyWeight } = this.meta.methods;
        let v = voteWeight * weightPrice;
        await buyWeight(projectIndex).send({from: this.account, value: v});
    },
    voteForCandidate: async function(projectIndex, candidateName, voteWeight) {
        const { voteForCandidate } = this.meta.methods;
        candidateName = this.web3.utils.fromUtf8(candidateName);

        console.log("projectIndex: ", projectIndex);
        console.log("candidateName: ", candidateName);
        await voteForCandidate(projectIndex, candidateName, voteWeight).send({from: this.account});
    },
    getVoteRecord: async function(projectIndex, recordIndex) {
        const { getVoteRecord } = this.meta.methods;
        let record = await getVoteRecord(projectIndex, recordIndex).call();
        return record;
    }
};

window.App = App;

window.addEventListener("load", async function () {
    if (window.ethereum) {
        // use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        window.ethereum.enable(); // get permission to access accounts
    } else {
        alert("pelease install the MetaMask chrome plugin.");
        console.warn(
            "No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live",
        );
        // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
        App.web3 = new Web3(
            new Web3.providers.HttpProvider("http://127.0.0.1:8545"),
        );
    }

    await App.start();
    await initHtml();
});

async function initHtml() {
    await App.refresh();
    $("#content").append("hello world!");
    console.log("projectNumber: ", projectNumber);
    if (projectNumber>0){
        DetailsVotingInfo(projectNumber);
    }
    for (let i = 1; i <= projectNumber; i++) {
        addVoteProject(i);
    }
    DisplayVoteRecords(projectNumber, recordNumber);
}

async function addVoteProject(i) {
    $("#main-content").prepend("<div class='row col-md-offset-2 col-md-12' id='voteProjectIndex-" + i.toString() + "' ></div>");
    let result = await App.getVoteProjectInfo(i);
    let voteProjectIndex = i;
    let voteProjectPubAddr = result[0];
    if (voteProjectPubAddr == App.account) {
        $("#voteProjectIndex-" + i.toString()).addClass("myself-voteProject");
    }
    let voteProjectStartTime = Format(new Date(result[1] * 1000), "yyyy-MM-dd HH:mm:ss");
    let voteProjectEndTime = Format(new Date(result[2] * 1000), "yyyy-MM-dd HH:mm:ss");
    let voteProjectName = result[3];
    $("#voteProjectIndex-" + i.toString()).append("<p class='voteProjectIndex'>" + "voteProjectIndex: " + voteProjectIndex.toString() + "</p>");
    $("#voteProjectIndex-" + i.toString()).append("<p class='voteProjectName'>" + "voteProjectName: " + voteProjectName.toString() + "</p>");
    $("#voteProjectIndex-" + i.toString()).append("<p class='voteProjectPubAddr'>" + "voteProjectPubAddr: " + voteProjectPubAddr.toString() + "</p>");
    $("#voteProjectIndex-" + i.toString()).append("<p class='voteProjectStartTime'>" + "voteProjectStartTime: " + voteProjectStartTime.toString() + "</p>");
    $("#voteProjectIndex-" + i.toString()).append("<p class='voteProjectEndTime'>" + "voteProjectEndTime: " + voteProjectEndTime.toString() + "</p>");
    $("#voteProjectIndex-" + i.toString()).append("<a href='#' id='buyTokens' onclick='App.into("+i.toString()+")' class='btn btn-primary'>into</a>");
    
}


function Format(date,fmt) {
    var o = {
        "M+": date.getMonth() + 1, //月份 
        "d+": date.getDate(), //日 
        "H+": date.getHours(), //小时 
        "m+": date.getMinutes(), //分 
        "s+": date.getSeconds(), //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

async function VotingDetailsInfo() {
    $("#candidate-rows").append("<tr><td>" + candidate + "</td><td id='" + candidates[candidate] + "'></td></tr>");
    
}

// 创建投票项目
App.create = async function() {
    let i1 = $("#voteProjectName").val();      
    let i2 = $("#voteProjectNowTime").val();
    i2 = parseInt(i2);  
    let i3 = $("#voteProjectEndTime").val();  
    i3 = parseInt(i3);
    let i4 = $("#voteProjectWeightPrice").val();
    i4 = Number(i4).toString();
    let i5 = $("#voteProjectAllWeight").val(); 
    i5 = parseInt(i5);
    let i6 = $("#voteProjectCandidates").val(); 
    i6 = JSON.parse(i6);

    let result = await App.createVoteProject(i1,i2,i3,i4,i5,i6);
    projectNumber++;
    currentProjectIndex = projectNumber;
    await addVoteProject(projectNumber);
    await DetailsVotingInfo(projectNumber);
}

// 更新投票详细信息
async function DetailsVotingInfo(projectIndex) {
    let projectInfo = await App.getVoteProjectDetailsInfo(projectIndex);
    let votingInfo = await App.getDetailsVotingInfo(projectIndex, App.account);
    
    $("#voteProjectInfo").html("");
    let tag = "";
    if (projectInfo[0] == App.account) {
        tag = "  <strong style='color:red'>(yourself)</strong>";
    }
    $("#voteProjectInfo").append("<p> publishAddress: "+projectInfo[0]+tag+"</p>");

    let voteProjectStartTime = Format(new Date(projectInfo[1] * 1000), "yyyy-MM-dd HH:mm:ss");
    $("#voteProjectInfo").append("<p> startTime: "+voteProjectStartTime+"</p>");
    let voteProjectEndTime = Format(new Date(projectInfo[2] * 1000), "yyyy-MM-dd HH:mm:ss");
    $("#voteProjectInfo").append("<p> endTime: "+voteProjectEndTime+"</p>");
    $("#voteProjectInfo").append("<p> project name: "+projectInfo[3]+"</p>");
    $("#voteProjectInfo").append("<p> all Weight: "+projectInfo[4]+"</p>");
    $("#voteProjectInfo").append("<p> weight balance: "+projectInfo[5]+"</p>");
    $("#voteProjectInfo").append("<p> weight Price: "+App.web3.utils.fromWei(projectInfo[6])+" Ether</p>");
    weightPrice = parseInt(projectInfo[6]);
    weightBalance = parseInt(projectInfo[5]);
    $("#accountInfomation").html("");
    $("#accountInfomation").append("<p> your account address: "+App.account+"</p>");
    let accountBalance = App.web3.utils.fromWei((await App.web3.eth.getBalance(App.account)).toString());
    $("#accountInfomation").append("<p> your account balance: <strong>"+accountBalance+"</strong> Ether </p>");

    $("#accountInfomation").append("<p> your weight balance: <strong>"+votingInfo[1]+"</strong></p>");
    
    console.log("projectInfo: ", projectInfo);
    console.log("votingInfo: ", votingInfo);
    $("#candidate-rows").html("");
    let candidateReceives = projectInfo[7]
    let candidateNames = projectInfo[8];
    for (let i=0;i<candidateNames.length;i++) {
        console.log("candidateNames[i]: ", candidateNames[i]);
        let candidateName = App.web3.utils.toUtf8(candidateNames[i]);
        console.log("candidateName", candidateName);
        let voteWeight = 0;
        if (votingInfo[2].length > 0) {
            voteWeight = votingInfo[2][i];
        }
        let content = "<tr><td>"+candidateName+"</td><td>"+candidateReceives[i]+"</td><td>"+voteWeight+"</td></tr>";
        $("#candidate-rows").append(content);
        
    }
}

App.buy = async function() {
    let voteWeight = parseInt($("#buy").val());
    await App.buyWeight(currentProjectIndex, weightPrice, voteWeight);
    DetailsVotingInfo(currentProjectIndex);
}

App.vote = async function() {
    let candidateName = $("#candidate").val();
    let voteWeight = $("#vote-weight").val();
    voteWeight = parseInt(voteWeight);
    await App.voteForCandidate(currentProjectIndex, candidateName, voteWeight);
    console.log("currentProjectIndex: ", currentProjectIndex);
    DetailsVotingInfo(currentProjectIndex);
    recordNumber++;
    addVoteRecord(currentProjectIndex, recordNumber);
}

App.into = async function(index) {
    currentProjectIndex = index;
    let result = await this.getVoteProjectDetailsInfo(currentProjectIndex);
    recordNumber = parseInt(result[9]);
    DetailsVotingInfo(currentProjectIndex);
    DisplayVoteRecords(currentProjectIndex, recordNumber);
}

async function DisplayVoteRecords(proIndex, recordNum) {
    $("#record-rows").html("");
    for (let i=1; i <= recordNum; i++) {
        addVoteRecord(proIndex, i);
    }
}

async function addVoteRecord(proIndex, i) {
    let result = await App.getVoteRecord(proIndex, i);
    let votedAddr = result[0];
    let weight = result[1];
    let votedCandidateName = App.web3.utils.toUtf8(result[2]);
    let time = Format(new Date(result[3] * 1000), "yyyy-MM-dd HH:mm:ss");
    console.log("time::::: ", time);
    let content = "<tr><td>"+votedAddr+"</td><td>"+votedCandidateName+"</td><td>"+time+"</td><td>"+weight+"</td></tr>";
    $("#record-rows").prepend(content);
}