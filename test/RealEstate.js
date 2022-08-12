
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
        

        const RealEstate = await ethers.getContractFactory("RealEstate");
        const Escrow = await ethers.getContractFactory("Escrow")

        const realEstate = await RealEstate.deploy();
        const escrow = await Escrow.deploy(realEstate.address);

        await realEstate.deployed();
        await escrow.deployed();

        console.log(`RealEstate deployed at ${realEstate.address}`)
        console.log(`Escrow deployed at ${escrow.address}`)
        console.log(`Deployer : ${deployer.address}. seller : ${seller.address}. Buyer : ${buyer.address}`)

        return {realEstate, escrow, deployer, seller, buyer}

    }

    it("Seller's property successfully minted.", async ()=>{
        const {realEstate, escrow, deployer, seller, buyer} = await loadFixture(contractDeployment);
        let tokenUri="https://ipfs.io/ipfs/QmP8Ug8aTcr4pBRJ223HGJ6ynYceuFjqUyC5j1LtkkUcRJ?filename=puducherryHouse.json";
        realEstate.safeMint(seller.address, tokenUri)

        let tokenId=0;
        
        expect(await realEstate.tokenURI(tokenId)).to.equal(tokenUri);
        expect(await realEstate.ownerOf(tokenId)).to.equal(seller.address);

    })

    it("Property NFT successfully transfered from seller to buyer", async ()=>{

        const {realEstate, escrow, deployer, seller, buyer} = await loadFixture(contractDeployment);

        console.log("going to mint an nft")
        //Let mint a token first
        let tokenUri="https://ipfs.io/ipfs/QmP8Ug8aTcr4pBRJ223HGJ6ynYceuFjqUyC5j1LtkkUcRJ?filename=puducherryHouse.json";
        realEstate.safeMint(seller.address, tokenUri)

        let nftId=0;
        let purchaseAmount=ether(100);
        let downpaymentAmount=ether(20);
                 
        expect(await realEstate.tokenURI(nftId)).to.equal(tokenUri);
        expect(await realEstate.ownerOf(nftId)).to.equal(seller.address);

        //Seller should approve the deployer to transfer nft to buyer
        await realEstate.connect(seller).approve(escrow.address, nftId);

        //set purchase amount
        await escrow.setPurchaseAmount(purchaseAmount);

        //set down paymanet amount
        await escrow.setDownPaymentAmount(downpaymentAmount);
        
        
        console.log(`purchase amount : ${ethers.utils.formatEther(purchaseAmount)} downpayment is ${ethers.utils.formatEther(downpaymentAmount)}`);

        //deposit downpayment into the escrow contract
        await escrow.connect(buyer).depositDownPayment({value : ether(30) });

        //get balance of the contact
        let balance = await escrow.getBalance();
        console.log(`Escrow contract balance is ${ethers.utils.formatEther(balance)}`);

        let leftAmount = await escrow.leftPaymentAmount();
        console.log(`Left payment : ${ethers.utils.formatEther(leftAmount)}`);


        //Start transfer 

         console.log(`Buyer : ${buyer.address} and seller is ${seller.address}`);
        
         console.log(`Before sale owner of NFT ${nftId} is ${await realEstate.ownerOf(nftId)}`)

         expect(await realEstate.ownerOf(nftId)).to.equal(seller.address);

         await escrow.transferRealEstateProperty(nftId, seller.address, buyer.address);
         

         console.log(`After sale owner of NFT ${nftId} is ${await realEstate.ownerOf(nftId)}`)
         expect(await realEstate.ownerOf(nftId)).to.equal(buyer.address);

    })


})