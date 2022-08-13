// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @dev NFT for a real estate property
 */
contract RealEstate is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("RealEstate", "REAL") {}

    //Map of address containing the NFT token IDs array
    //this can be used to get all nft ids for a given address
    mapping(address=>uint256[]) private propertyOwnersMap;

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        //Save this token id to the propertyOwnersMap
        propertyOwnersMap[to].push(tokenId);

        _tokenIdCounter.increment();

    }

    // The following 2 functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev function to get list of all tokenIDs belonging to a specific owner address
     * @param propertyOwner address of the property owner whose token ids one want to fetch
     * @return tokenIds array of token ids
     */
    function getAllTokenIDs(address propertyOwner) public view returns(uint256[] memory tokenIds){
        return propertyOwnersMap[propertyOwner];
    }
}