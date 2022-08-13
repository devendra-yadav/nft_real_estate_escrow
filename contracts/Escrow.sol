// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @dev This is the smart contract for real estate escrow.
 * Escrow is the 3rd party responsible to complete the transaction of buy/sell of a NFT Real estate
 */
contract Escrow {

    address public owner;

    address public nftContractAddress;
    uint256 nftId;

    address public buyer;
    address public seller;
    address public lender;

    //verifier will do the inspection of the property and provide the InspectionStatus
    address public verifier;

    uint256 public downPaymentAmount;
    uint256 public purchaseAmount;
    uint256 public leftPaymentAmount;

    mapping(address=>bool) public approvals;

    modifier onlyOwner() {
        require(owner == msg.sender, "Only contract owner can run this function");
        _;
    }

    modifier onlyBuyer(){
        require(msg.sender == buyer, "Only BUYER can make the downpayment");
        _;
    }

    modifier onlyVerifier(){
        require(verifier == msg.sender,"Only VERIFIER can change the inspection status");
        _;
    }

    InspectionStatus public inspectionStatus;

    enum InspectionStatus {
        INITIATED,
        PASSED,
        FAILED
    }

    constructor(address _nftContractAddress, uint256 _nftId, address _seller, address _buyer, 
        address _lender, address _verifier, uint256 _purchaseAmount, uint256 _downPaymentAmount) {
        nftContractAddress = _nftContractAddress;
        nftId = _nftId;
        seller = _seller;
        buyer = _buyer;
        lender = _lender;
        verifier = _verifier;
        purchaseAmount = _purchaseAmount;
        downPaymentAmount = _downPaymentAmount;
        leftPaymentAmount = _purchaseAmount;
        inspectionStatus = InspectionStatus.INITIATED;
        owner = msg.sender;
    }

    /**
     * @dev this function is to do the final nft transfer from seller to buyer
     */
    function transferRealEstateProperty() public onlyOwner{
        require(inspectionStatus == InspectionStatus.PASSED, "Inspection status must be PASSED");

        require(approvals[buyer] == true, "Must be approved by Buyer");
        require(approvals[seller] == true, "Must be approved by Seller");
        require(approvals[lender] == true, "Must be approved by Lender");

        require(leftPaymentAmount==0, "Some payment still left.");

        require(address(this).balance == purchaseAmount, "Not enough balance");

        (bool res,) = payable(seller).call{value : address(this).balance}("");
        require(res);

        (IERC721)(nftContractAddress).safeTransferFrom(seller, buyer, nftId);
    }

    /**
     * @dev this function is to give approval to the deal. 
     * whoever calls this function. his approval will be set accordingly
     * @param approval true/false value
     */
    function provideApproval(bool approval) public {
        approvals[msg.sender] = approval;
    }

    /**
     * @dev this function is to make down payment.
     * it will reduce that amount from the total purchase amount
     */
    function depositDownPayment() public payable onlyBuyer{
        require(msg.value >= downPaymentAmount, "Downpayment amount is not enough");
        leftPaymentAmount = purchaseAmount - msg.value;
    }

    /**
     * @dev this function is to make the remaining amount to purchase the nft
     */
    function depositRemainingAmount() public payable{
        require(leftPaymentAmount>0, "Nothing left to pay. All payments done");
        require(msg.value > 0, "Amount should be greater than 0");
        require(msg.value <= leftPaymentAmount, "Amount is more than required.");
        leftPaymentAmount = leftPaymentAmount - msg.value;
    }

    /**
     * @dev update the inspection status. Only verifier can do this
     */
    function updateInspectionStatus(InspectionStatus _status) public onlyVerifier{
        inspectionStatus = _status;
    }

    /**
     * @dev this function sets the purchase amount of the nft in case of need for overriding the original value
     * @param _purchaseAmount selling price of the nft in ethers
     */
    function setPurchaseAmount(uint256 _purchaseAmount) public onlyOwner{
        require(_purchaseAmount>0, "Purchase amount should be greater than 0");
        purchaseAmount=_purchaseAmount;        
    }

    /**
     * @dev this function sets the downpayment for the purchase of the nft in case of the need for overriding the original value
     * @param _downPaymentAmount downpayment in ethers
     */
    function setDownPaymentAmount(uint256 _downPaymentAmount) public onlyOwner{
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

    /**
     * @dev returns balance of given wallet address
     * @return balance balance of the wallet
     */
    function getBalanceOf(address walletAddress) public view returns(uint256 balance){
        return walletAddress.balance;
    }
}