// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


contract Escrow {

    address public nftContractAddress;
    
    constructor(address _nftContractAddress) {
        nftContractAddress = _nftContractAddress;
    }

    function transferRealEstateProperty(uint256 propertyNftId, address seller, address buyer) public {
        (IERC721)(nftContractAddress).safeTransferFrom(seller, buyer, propertyNftId);
    }
}