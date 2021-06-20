window.addEventListener('load', async () => {
    // New web3 provider
    if (window.ethereum) {
        window.web3 = new Web3(window.ethereum);
        try {
            // ask user for permission
            await window.ethereum.enable();
            callCheck();

            //   checkAccount();
            // user approved permission
        } catch (error) {
            // user rejected permission
            $("#notifictionMessage").html("User Rejected to connect with Metamask")
            $(".tipBox").css("opacity", "1");
        }
    }
    // Old web3 provider
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
        // no need to ask for permission
    }
    // No web3 provider
    else {
        $("#notifictionMessage").html("Metamask is not Installed")
        $(".tipBox").css("opacity", "1");
    }
});
var ethPrice;


// 0xD03216CC8EaE6a1522b784Ad3FA66424F227dA62 masterchef
const stakeAddress = "0xD03216CC8EaE6a1522b784Ad3FA66424F227dA62";
const UniPool= "0x93c03dae6efabf1e11953a5b682643b3f8425580";
const RewardToken="0xed907a2af9f64507e3b8b8f0c5c4fd086d1986a2";
const UniswapFactory="0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
// 0xb2dbf14d0b47ed3ba02bdb7c954e05a72deb7544 Reward
// 0x2cea677e38f16a3016cab43b533efda0458af0e6 staking token
const tokenAddress = ["0xfdfd27ae39cebefdbaac8615f18aa68ddd0f15f5"];
var wethAddres = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

const networkId = 56; //!bsc mainnet network id
const ETH_BLOCK_TIME = 3;
const BLOCKS_PER_YEAR = (60 / ETH_BLOCK_TIME) * 60 * 24 * 365;

let userStake = 0;
let userBalance = 0;
let userApproved = 0;
let totalStakeAmount = 0;
let totalETHInUniPool = 0;
let totalMobiFiInUniPool = 0;
let totalLPSupply = 0;
let tokens = '';
let tokenInstance = [];
let userStakedTokenIndex = 0;
let userStakedTokenAddress = '';
let lpToken= [];
// let MAX_AMOUNT = 5000; // ! TO CHECK

async function callCheck() {
    let address = await window.web3.eth.getAccounts();
    let id = await window.web3.eth.net.getId();
    window.id = id;
    
    window.walletAddress = address[0];
    
    if (id !== networkId) {
        $("#notifictionMessage").html("Please Select BSC Network")
        $(".tipBox").css("opacity", "1");
        return false;
    }
    window.wethInstance = await new window.web3.eth.Contract(tokenabi, wethAddres);    
    window.StakeInstance = await new window.web3.eth.Contract(stakeabi, stakeAddress);
    window.FactoryInstance= await new window.web3.eth.Contract(factoryabi,UniswapFactory);
    window.RewardInstance= await new window.web3.eth.Contract(tokenabi,RewardToken);
    for (var i = 0; i < tokenAddress.length; i++) {
        tokenInstance[i] = await new window.web3.eth.Contract(tokenabi, tokenAddress[i]);
    }
   
    tokenList();
    let account = address[0].substr(0, 5) + "..." + address[0].substr(-4)
    $("#userAddress").html(account.toLowerCase());
    $("#myModal").modal('show');
}


async function balanceChecker(index) {
    
    let address = window.walletAddress;
    userStake = window.web3.utils.fromWei((await window.StakeInstance.methods.userInfo(index, address).call()).amount);
    userBalance = window.web3.utils.fromWei(await tokenInstance[index].methods.balanceOf(address).call());
    userApproved = BigInt(await tokenInstance[index].methods.allowance(address, stakeAddress).call());
    totalStakeAmount = window.web3.utils.fromWei(await tokenInstance[index].methods.balanceOf(stakeAddress).call());
    $("#userBalance").html(Number(userBalance).toFixed(2));
    $("#userStake").html(Number(userStake).toFixed(2));
    $("#userTotal").html((Number(userBalance) + Number(userStake)).toFixed(2));
    $("#totalStakeAmount").html(Number(totalStakeAmount).toFixed(2));

    calcUserBalance();
}

async function tokenList() {

    $.getJSON("./token_logo.json", async function (data) {
        //todo adding support of multiple plan can be done here I think
        let tokenLength = 4
        // let tokenLength = await window.StakeInstance.methods.availabletokens().call();
        let tokenSymbol;

        var tokenDiv = document.getElementById('token-list');

        for (var i = 0; i < tokenLength; i++) {
            tokens = RewardToken;
            tokenSymbol =  data[i].name;
            var tokensym = document.createElement('div');
            var linebreak = document.createElement('br')
            tokensym.innerHTML = tokenSymbol;
            tokensym.id = "avltoken" + i;
            lpToken.push(data[i].lpstatus);
            var tokenImageDiv = document.createElement('div');
            tokenImageDiv.className = "token-symbol";
            var tokenImg = document.createElement('img');
            tokenImg.src = data[i].logo;
            // tokenImageDiv.prepend(tokenImg);
            tokensym.prepend(tokenImg);
            tokensym.setAttribute('onclick', 'tokenToBeStaked(this.id)');
            tokenDiv.appendChild(tokensym);
            tokensym.appendChild(linebreak);
        }
    });

}

function tokenToBeStaked(id) {
    var symbol = document.getElementById(id).innerHTML;
    var index = id.substr(-1);
    var stakeTokenAddress = tokenAddress[index];
    for (var i = 0; i < tokenAddress.length; i++) {
        if (tokenAddress[i] == stakeTokenAddress) userStakedTokenIndex = i;
        userStakedTokenAddess = stakeTokenAddress;
    }
    balanceChecker(userStakedTokenIndex);
    $('#myModal').modal('hide');

    $.getJSON("./token_logo.json", function (data) {
        var tokendata = [];
        $.each(data, function (index, value) {
            tokendata.push(value);

        });

        for (var i = 0; i < tokendata.length; i++) {
            if (index == tokendata[i].index) {
                var img = tokendata[i].logo;
                document.getElementById("token-logo").src = img;
                document.getElementById("auint").innerHTML = tokendata[i].name;
                document.getElementById("suint").innerHTML = tokendata[i].name;
                document.getElementById("tuint").innerHTML = tokendata[i].name;
            }
        }
    });
}

async function calcUserBalance() {
    let address = window.walletAddress;
    var totalRewardAvailable = Number(window.web3.utils.fromWei(await window.StakeInstance.methods.pendingSushi(userStakedTokenIndex, address).call()));
    $.getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd`,
    async function (data) {
        ethPrice = Object.values(data)[0].usd;
        tokenLiquidityPool=await window.FactoryInstance.methods.getPair(tokenInstance[userStakedTokenIndex]._address,wethAddres).call(); 
        totalETHInUniPool = Number(window.web3.utils.fromWei(await window.wethInstance.methods.balanceOf(tokenLiquidityPool).call()));
        totalMobiFiInUniPool = Number(window.web3.utils.fromWei(await tokenInstance[userStakedTokenIndex].methods.balanceOf(tokenLiquidityPool).call()));
        totalLPSupply = Number(window.web3.utils.fromWei(await tokenInstance[userStakedTokenIndex].methods.totalSupply().call()));
        console.log(ethPrice+" ethPrice");
        console.log(tokenLiquidityPool+ " tokenLiquidityPool");
        console.log(totalETHInUniPool+ " totalETHInUniPool");
        console.log(totalLPSupply+ " totalLPSupply");

        tokenLiquidityPoolReward=await window.FactoryInstance.methods.getPair(RewardToken,wethAddres).call(); 
        totalETHInUniPoolReward = Number(window.web3.utils.fromWei(await window.wethInstance.methods.balanceOf(tokenLiquidityPoolReward).call()));
        totalMobiFiInUniPoolReward = Number(window.web3.utils.fromWei(await RewardInstance.methods.balanceOf(tokenLiquidityPoolReward).call()));
        var totalUSDInUniPoolReward = ethPrice * totalETHInUniPoolReward;
        var totalUSDInUniPool = ethPrice * totalETHInUniPool;
        console.log(tokenLiquidityPoolReward+" tokenLiquidityPoolReward");
        console.log(totalETHInUniPoolReward+" totalETHInUniPoolReward");
        console.log(totalMobiFiInUniPoolReward+" totalMobiFiInUniPoolReward");
        console.log(totalUSDInUniPoolReward+ " totalUSDInUniPoolReward");
        console.log(totalUSDInUniPool+ " totalUSDInUniPool");
        var stakingTokenPrice;
        var rewardTokenPrice;
        $.getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=giftedhands&vs_currencies=usd`,
        async function (data) {
              rewardTokenPrice = Object.values(data)[0].usd;
        });
        if(lpToken[userStakedTokenIndex]==true){
            totalETHInUniPoolLp = Number(window.web3.utils.fromWei(await window.wethInstance.methods.balanceOf(tokenInstance[userStakedTokenIndex]._address).call()));
            console.log(totalETHInUniPoolLp+" totalETHInUniPoolLp");
            var totalUSDInUniPoolLp = ethPrice * totalETHInUniPoolLp;
            console.log(totalUSDInUniPoolLp+" totalUSDInUniPoolLp");
             stakingTokenPrice = totalUSDInUniPoolLp  * 2 / totalLPSupply ;
            console.log(stakingTokenPrice+ " stakingTokenPrice");
        }
        else{
             stakingTokenPrice = totalUSDInUniPool / totalMobiFiInUniPool;
            console.log(stakingTokenPrice+ " stakingTokenPrice");
        }
        console.log(rewardTokenPrice+ " rewardTokenPrice");
        const sushiPerBlock=await StakeInstance.methods.sushiPerBlock().call();
        const totalAllocationPoint=await StakeInstance.methods.totalAllocPoint().call();
        const poolInfo=await StakeInstance.methods.poolInfo(userStakedTokenIndex).call();
        const bonusEndBlock=await StakeInstance.methods.bonusEndBlock().call()
        const bonusMultiplier=await StakeInstance.methods.BONUS_MULTIPLIER().call()
        const BlockNumber=await window.web3.eth.getBlockNumber();
        console.log(tokenLiquidityPoolReward+" tokenLiquidityPoolReward");
        console.log(totalETHInUniPoolReward+" totalETHInUniPoolReward");
        console.log(sushiPerBlock+" sushiPerBlock");
        console.log(bonusEndBlock+" bonusEndBlock");
        console.log(bonusMultiplier+" bonusMultiplier");
        console.log(BlockNumber+" BlockNumber");
        console.log(totalAllocationPoint+" totalAllocationPoint");
        console.log(poolInfo+" poolInfo");
        
        let tokenPerBlock;
        if(BlockNumber<bonusEndBlock){
        tokenPerBlock = web3.utils.fromWei(sushiPerBlock)*bonusMultiplier/totalAllocationPoint*poolInfo[1];
        }
        else{
        tokenPerBlock = web3.utils.fromWei(sushiPerBlock)/totalAllocationPoint*poolInfo[1];
        }
        console.log(tokenPerBlock+" tokenPerBlock");
        var totalStakingTokenInPool = stakingTokenPrice * totalStakeAmount
        console.log(totalStakingTokenInPool+" totalStakingTokenInPool");
        if (totalStakingTokenInPool == 0)
            $("#apy_id").html("Empty Pool");
        else {
            var apy = (rewardTokenPrice * tokenPerBlock * BLOCKS_PER_YEAR) / totalStakingTokenInPool
            $("#apy_id").html(Number(apy*100).toFixed(2)+'%');
            console.log(apy+"  apy");
            console.log(Number(apy*100).toFixed(2)+'%');
        }
    });

    $("#accrued_rewards").html((Number(totalRewardAvailable)).toFixed(2));
    // let temp_a = (7500000 * stakingTokenPrice / totalStakingTokenInPool * stakingTokenPrice) * 100

}

function maxStakeAmount() {
    $("#stakeAmount").val(userBalance);
}

async function maxUnStakeAmount() {
    let address = window.walletAddress;

    var totalRewardClaimed = window.web3.utils.fromWei((await window.StakeInstance.methods.userInfo(userStakedTokenIndex, address).call()).amount);

    $("#unstakeAmount").val(Number(totalRewardClaimed));

}

async function approve() {
    let a = $("#stakeAmount").val();
    let address = window.walletAddress;
    if (Number(a) > userBalance) {
        return false;
    }
    a = window.web3.utils.toWei(a);
    if (userApproved >= a) {
        $("#notifictionMessage").html("Token Is Approved You can Stake Now")
        $(".tipBox").css("opacity", "1");
        $("#stakeAmount").attr("disabled", "true");

        $("#stakeButtonDiv").html("<div class='maxButton max button' onclick='stake();'><span class='label'>Stake</span></div>")
        $("#maxButton").hide();
        console.log($("#maxButton"))
    } else {
        let a = $("#stakeAmount").val();
        let address = window.walletAddress;
        if (Number(a) > userBalance) {
            return false;
        }
        a = window.web3.utils.toWei(a);

        tokenInstance[userStakedTokenIndex].methods.approve(stakeAddress, a).send({ from: address, value: 0, })
            .on('transactionHash', (hash) => {
                showLoader("Approving Tokens")
            })
            .on('receipt', (receipt) => {
                hideLoader();
                $("#notifictionMessage").html("Token Is Approved You can Stake Now")
                $(".tipBox").css("opacity", "1");
                $("#stakeAmount").attr("disabled", "true");
                $("#maxButton").hide();
                $("#stakeButtonDiv").html("<div class='maxButton max button' onclick='stake();'><span class='label'>Stake</span></div>")

            }).on("error", (error) => {
                hideLoader()
                if (error.message.includes("User denied transaction signature")) {
                    $("#notifictionMessage").html("User denied transaction signature")
                    $(".tipBox").css("opacity", "1");
                } else {
                    $("#notifictionMessage").html("Your Approval failed, please try again")
                    $(".tipBox").css("opacity", "1");
                }
            })
    }
}

async function stake() {

    let a = $("#stakeAmount").val();
    let address = window.walletAddress;
    let originalValue = a;
    a = window.web3.utils.toWei(a);
    window.StakeInstance.methods.deposit(userStakedTokenIndex, a).send({ from: address, value: 0, })
        .on('transactionHash', (hash) => {
            showLoader("Staking")
        })
        .on('receipt', (receipt) => {
            $("#stakeAmount").removeAttr("disabled");
            $("#stakeAmount").val("0");
            $("#stakeButtonDiv").html("<div class=\"maxButton max button\" onclick=\"approve();\"><span\n" +
                "                                        class=\"label\">Approve</span></div>")

            setTimeout(() => {
                $("#notifictionMessage").html(originalValue + " Token Staked Successfully")
                $(".tipBox").css("opacity", "1");
                hideLoader();
                balanceChecker(userStakedTokenIndex);
                closeStake();
            }, 2000)
        }).on("error", (error) => {
            hideLoader();
            if (error.message.includes("User denied transaction signature")) {
                $("#notifictionMessage").html("User denied transaction signature")
                $(".tipBox").css("opacity", "1");
            } else {
                $("#notifictionMessage").html("Your Stake failed, please try again")
                $(".tipBox").css("opacity", "1");
            }
        })

}

async function unstake() {
    let a = $("#unstakeAmount").val();
    let address = window.walletAddress;
    let originalValue = a;
    var totalStakedAmount = (await window.StakeInstance.methods.userInfo(userStakedTokenIndex, address).call()).amount;
    a = BigInt(window.web3.utils.toWei(a));
    if (a > totalStakedAmount) {
        $("#unstakeAmount").val(totalStakedAmount);
        a = totalStakedAmount
    }
    window.StakeInstance.methods.withdraw(userStakedTokenIndex, a.toString()).send({ from: address, value: 0 })
        .on('transactionHash', (hash) => {
            showLoader("UnStaking");
        }).on('receipt', (receipt) => {
            $("#stakeAmount").removeAttr("disabled");
            $("#stakeAmount").val("0");
            setTimeout(() => {
                $("#notifictionMessage").html(originalValue + " Token Unstaked Succesfully")
                $(".tipBox").css("opacity", "1");
                hideLoader();
                balanceChecker(userStakedTokenIndex);
                closeUnStake();
            })
        }).on("error", (error) => {
            hideLoader();
            if (error.message.includes("User denied transaction signature")) {
                $("#notifictionMessage").html("User denied transaction signature")
                $(".tipBox").css("opacity", "1");
            } else {
                $("#notifictionMessage").html("Your Stake failed, please try again")
                $(".tipBox").css("opacity", "1");
            }
        })
}

function showLoader(text) {
    $.LoadingOverlay("show", {
        image: "images/loader.png",
        text: text,
        textResizeFactor: 0.4
    });
}

function hideLoader() {
    $.LoadingOverlay("hide");
}

function closeStake() {
    $("#stakeAmount").removeAttr("disabled");
    $("#stakeAmount").val("0");
    $("#stakeButtonDiv").html("<div class=\"maxButton max button\" onclick=\"approve();\"><span\n" +
        "                                        class=\"label\">Approve</span></div>")
    $("#maxButton").show();
    $(".stake").removeClass("open");
    $(".stake .openTitle").hide();
    $(".stake .openTitle").css("letter-spacing", "0px");
    $(".stake .closeTitle").show();
    $(".stake .closeTitle").css("letter-spacing", "0px");
    $(".unstake").removeClass("close");
    $(".stake .floatEditor").hide();
    $(".stake .floatEditor").css("opacity", "0");
    $(".stake .floatClose").hide();
    $(".stake .floatClose").css("opacity", "0");
}

function closeUnStake() {
    $(".unstake").removeClass("open");
    $(".unstake .openTitle").hide();
    $(".unstake .openTitle").css("letter-spacing", "0px");
    $(".unstake .closeTitle").show();
    $(".unstake .closeTitle").css("letter-spacing", "0px");
    $(".stake").removeClass("close");
    $(".unstake .floatEditor").hide();
    $(".unstake .floatEditor").css("opacity", "0");
    $(".unstake .floatClose").hide();
    $(".unstake .floatClose").css("opacity", "0");
}


$(document).ready(function () {

    $(".stake").click(function () {
        if ($(event.target).hasClass("tipClose")) {
            return;
        }
        if (window.id !== networkId) {
            return;
        }

        $(".stake").addClass("open");
        $(".stake .openTitle").show();
        $(".stake .openTitle").css("letter-spacing", "0px");
        $(".stake .closeTitle").hide();
        $(".stake .closeTitle").css("letter-spacing", "38px");
        $(".unstake").addClass("close");
        $(".stake .floatEditor").show();
        $(".stake .floatEditor").css("opacity", "1");
        $(".stake .floatClose").show();
        $(".stake .floatClose").css("opacity", "1");
    })

    $(".unstake").click(function () {
        if ($(event.target).hasClass("tipClose")) {
            return;
        }
        if (window.id !== networkId) {
            return;
        }
        if (Number(userStake) === 0) {
            $("#notifictionMessage").html("Stake Some Token First")
            $(".tipBox").css("opacity", "1");
            return;
        }
        $(".unstake").addClass("open");
        $(".unstake .openTitle").show();
        $(".unstake .openTitle").css("letter-spacing", "0px");
        $(".unstake .closeTitle").hide();
        $(".unstake .closeTitle").css("letter-spacing", "38px");
        $(".stake").addClass("close");
        $(".unstake .floatEditor").show();
        $(".unstake .floatEditor").css("opacity", "1");
        $(".unstake .floatClose").show();
        $(".unstake .floatClose").css("opacity", "1");
    })


    $("#stakeClose .tipClose").click(function () {
        closeStake();
    })

    $("#unStakeClose .tipClose").click(function () {
        closeUnStake()
    })

    $("#notiClose").click(function () {
        $(".tipBox").css("opacity", "0");
    })

    $('#stakeAmount').keydown(function (event) {
        if (event.shiftKey == true)
            event.preventDefault();
        var code = event.keyCode;
        if ((code >= 48 && code <= 57) || (code >= 96 && code <= 105) || code == 8 || code == 9 || code == 37 || code == 39 || code == 46 || code == 190 || code == 110) {
            // allowed characters
        } else
            event.preventDefault();
    })

    $('#stakeAmount').keyup(function () {

        if (Number($(this).val()) > userBalance) {
            $("#stakeAmount").val(userBalance);

        }
        if (Number($(this).val()) > MAX_AMOUNT) {
            $("stakeAmount").val(MAX_AMOUNT);
        }
    })
})



