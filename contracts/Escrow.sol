// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev This is the smart contract for real estate escrow.
 * Escrow is the 3rd party responsible to complete the transaction of buy/sell of a NFT Real estate
 */
contract Escrow {

    //address of owner of this contract
    address public owner;

    //Contract address for the NFT real estate
    address public nftContractAddress;

    //address who provide the loan to the buyer
    address public lender;

    //address who verifies the nft real estate sale
    address public verifier;

    //Actual downpayment amount calculated by a function below based on downPaymentPercentage
    uint256 public downPaymentAmount;
    
    //Purchase amount of the real estate nft
    uint256 public purchaseAmount;

    //Left payment amount to buy the nft real estate
    uint256 public leftPaymentAmount;

    modifier onlyOwner() {
        require(owner == msg.sender, "Only owner can run this function");
        _;
    }

    constructor(address _nftContractAddress) {
        nftContractAddress = _nftContractAddress;
        owner = msg.sender;
    }

    /**
     * @dev this function is to make down payment.
     * it will reduce that amount from the total purchase amount
     */
    function depositDownPayment() public payable{
        require(msg.value >= downPaymentAmount, "Downpayment amount is not enough");
        leftPaymentAmount = purchaseAmount - msg.value;
    }

    /**
     * @dev this function will do the nft transfer from seller to buyer
     * @param propertyNftId nft id of the real estate property
     * @param seller address of the seller
     * @param buyer address of the buyer
     */
    function transferRealEstateProperty(uint256 propertyNftId, address seller, address buyer) public {
        (IERC721)(nftContractAddress).safeTransferFrom(seller, buyer, propertyNftId);
    }

    /**
     * @dev this function sets the purchase amount of the nft
     * @param _purchaseAmount selling price of the nft in ethers
     */
    function setPurchaseAmount(uint256 _purchaseAmount) public {
        require(_purchaseAmount>0, "Purchase amount should be greater than 0");
        purchaseAmount=_purchaseAmount;        
    }

    /**
     * @dev this function sets the downpayment for the purchase of the nft
     * @param _downPaymentAmount downpayment in ethers
     */
    function setDownPaymentAmount(uint256 _downPaymentAmount) public {
        require(_downPaymentAmount>0, "Downpayment amount should be greater than 0");
        downPaymentAmount=_downPaymentAmount;
        
    }

    /**
     * @dev get ETH balance of the contract
     * @return balance balance in ethers
     */
    function getBalance() public view returns(uint256 balance){
        return address(this).balance;
    }
}