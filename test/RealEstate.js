
const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers")
const {ethers} = require("hardhat")
const {expect} = require("chai")

const ether = (n)=>{
    return ethers.utils.parseEther(n.toString())
}

describe("RealEstate",()=>{

    async function contractDeployment(){

        let accounts = await ethers.getSigners();

        let deployer = accounts[0];
        let seller = accounts[1];
        let buyer = accounts[2];
        let lender = accounts[3];
        let verifier = accounts[4];
        
        const purchaseAmount = ether(100);
        const downpaymentAmount = ether(20);

        const RealEstate = await ethers.getContractFactory("RealEstate");
        const Escrow = await ethers.getContractFactory("Escrow")

        const realEstate = await RealEstate.deploy();
        const escrow = await Escrow.deploy(realEstate.address,0,seller.address, buyer.address,lender.address, verifier.address, purchaseAmount, downpaymentAmount);

        

        await realEstate.deployed();
        await escrow.deployed();

        console.log(`RealEstate deployed at ${realEstate.address}`)
        console.log(`Escrow deployed at ${escrow.address}`)
        console.log(`Deployer : ${deployer.address}. seller : ${seller.address}. Buyer : ${buyer.address}`)

        return {realEstate, escrow, deployer, seller, buyer, lender, verifier, purchaseAmount, downpaymentAmount}

    }

    it("Seller's property successfully minted.", async ()=>{
        const {realEstate, escrow, deployer, seller, buyer, lender, verifier, purchaseAmount, downpaymentAmount} = await loadFixture(contractDeployment);
        let tokenUri="https://ipfs.io/ipfs/QmP8Ug8aTcr4pBRJ223HGJ6ynYceuFjqUyC5j1LtkkUcRJ?filename=puducherryHouse.json";
        realEstate.safeMint(seller.address, tokenUri)

        let tokenId=0;
        
        expect(await realEstate.tokenURI(tokenId)).to.equal(tokenUri);
        expect(await realEstate.ownerOf(tokenId)).to.equal(seller.address);

    })

    it("Property NFT successfully transfered from seller to buyer", async ()=>{

        const {realEstate, escrow, deployer, seller, buyer, lender, verifier, purchaseAmount,downpaymentAmount } = await loadFixture(contractDeployment);
        sellerBalance = ethers.utils.formatEther(await escrow.getBalanceOf(seller.address))
         buyerBalance = ethers.utils.formatEther(await escrow.getBalanceOf(buyer.address))
         lenderBalance = ethers.utils.formatEther(await escrow.getBalanceOf(lender.address))
    
         console.log(`Seller Balance : ${sellerBalance}. Buyer Balance : ${buyerBalance} lender Balance : ${lenderBalance}`)

        console.log("going to mint an nft")
        //Let mint a token first
        let tokenUri="https://ipfs.io/ipfs/QmP8Ug8aTcr4pBRJ223HGJ6ynYceuFjqUyC5j1LtkkUcRJ?filename=puducherryHouse.json";
        realEstate.safeMint(seller.address, tokenUri)

        let nftId=0;
        
        expect(await realEstate.tokenURI(nftId)).to.equal(tokenUri);
        expect(await realEstate.ownerOf(nftId)).to.equal(seller.address);

        //Seller should approve the deployer to transfer nft to buyer
        await realEstate.connect(seller).approve(escrow.address, nftId);

        
        console.log(`purchase amount : ${ethers.utils.formatEther(purchaseAmount)} downpayment is ${ethers.utils.formatEther(downpaymentAmount)}`);

        //deposit downpayment into the escrow contract
        await escrow.connect(buyer).depositDownPayment({value : downpaymentAmount });

        //get balance of the contact
        let balance = await escrow.getBalance();
        console.log(`Escrow contract balance is ${ethers.utils.formatEther(balance)}`);

        let leftAmount = await escrow.leftPaymentAmount();
        console.log(`Left payment : ${ethers.utils.formatEther(leftAmount)}`);

        console.log(`inspection status before : ${await escrow.inspectionStatus()}`)
        
        //Do the inspection adn update inspection status
        await escrow.connect(verifier).updateInspectionStatus(1);

        console.log(`inspection status after : ${await escrow.inspectionStatus()}`)

        //Buyer to provide approval
        await escrow.connect(buyer).provideApproval(true);

        //Seller to provide approval
        await escrow.connect(seller).provideApproval(true);

       

        //Lender to pay left amount
        await escrow.connect(lender).depositRemainingAmount({value: ether(80)});
        console.log(`Lender did the payment`);
        
        leftAmount = await escrow.leftPaymentAmount();
        console.log(`Left payment : ${ethers.utils.formatEther(leftAmount)}`);

        //Lender  to provide approval
         await escrow.connect(lender).provideApproval(true);

         console.log("All approvals given (buyer, seller and lender).")

        //Start transfer 

         console.log(`Buyer : ${buyer.address} and seller is ${seller.address}`);
        
         console.log(`Before sale owner of NFT ${nftId} is ${await realEstate.ownerOf(nftId)}`)

         expect(await realEstate.ownerOf(nftId)).to.equal(seller.address);

         await escrow.transferRealEstateProperty();
         

         console.log(`After sale owner of NFT ${nftId} is ${await realEstate.ownerOf(nftId)}`)
         
         sellerBalance = ethers.utils.formatEther(await escrow.getBalanceOf(seller.address))
         buyerBalance = ethers.utils.formatEther(await escrow.getBalanceOf(buyer.address))
         lenderBalance = ethers.utils.formatEther(await escrow.getBalanceOf(lender.address))
    
         console.log(`Seller Balance : ${sellerBalance}. Buyer Balance : ${buyerBalance} lender Balance : ${lenderBalance}`)
        
         //ethers.js also can fetch balance. following is the way to do it
        //  const tempBalance = await ethers.provider.getBalance(seller.address);
        //  console.log(`temp balance is ${ethers.utils.formatEther(tempBalance)}`)

         expect(await realEstate.ownerOf(nftId)).to.equal(buyer.address);


    })


})