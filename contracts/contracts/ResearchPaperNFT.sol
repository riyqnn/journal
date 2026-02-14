// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ResearchPaperNFT
 * @notice NFT contract for research papers with IPFS metadata and royalty support
 * @dev Implements ERC721, ERC721URIStorage, and ERC2981 (Royalty Standard)
 */
contract ResearchPaperNFT is ERC721, ERC721URIStorage, ERC2981, Ownable {
    /// @notice Paper status enum
    enum Status { Draft, Verified, Rejected, DataPool }

    /// @notice Token ID counter
    uint256 private _tokenIdCounter;

    /// @notice Paper metadata structure
    struct PaperMetadata {
        string title;
        string author;
        string affiliation;
        string ipfsHash;
        Status status;
        uint256 mintedAt;
    }

    /// @notice Mapping from token ID to paper metadata
    mapping(uint256 => PaperMetadata) public papers;

    /// @notice Emitted when a new paper is minted
    event PaperMinted(
        uint256 indexed tokenId,
        address indexed author,
        string ipfsHash,
        string title
    );

    /// @notice Emitted when paper status is updated
    event StatusUpdated(uint256 indexed tokenId, Status newStatus);

    /**
     * @notice Constructor
     * @dev Sets up the NFT contract with name and symbol, and default 5% royalty
     */
    constructor() ERC721("JUDOL Research Papers", "JUDOL") Ownable(msg.sender) {
        // Set default royalty to 5% (500 basis points)
        _setDefaultRoyalty(msg.sender, 500);
    }

    /**
     * @notice Mint a new research paper NFT
     * @param to Address to mint the NFT to
     * @param ipfsHash IPFS hash pointing to the metadata JSON
     * @param title Title of the research paper
     * @param author Name of the primary author
     * @param affiliation Institution/organization affiliation
     * @return tokenId The ID of the newly minted token
     */
    function mintPaper(
        address to,
        string memory ipfsHash,
        string memory title,
        string memory author,
        string memory affiliation
    ) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;

        // Mint the NFT
        _safeMint(to, tokenId);

        // Set the token URI (IPFS metadata)
        _setTokenURI(tokenId, ipfsHash);

        // Store paper metadata
        papers[tokenId] = PaperMetadata({
            title: title,
            author: author,
            affiliation: affiliation,
            ipfsHash: ipfsHash,
            status: Status.Draft,
            mintedAt: block.timestamp
        });

        emit PaperMinted(tokenId, to, ipfsHash, title);

        return tokenId;
    }

    /**
     * @notice Update the status of a paper
     * @dev Only callable by contract owner
     * @param tokenId ID of the token
     * @param newStatus New status to set
     */
    function updateStatus(uint256 tokenId, Status newStatus) external onlyOwner {
        papers[tokenId].status = newStatus;
        emit StatusUpdated(tokenId, newStatus);
    }

    /**
     * @notice Get the total number of minted papers
     * @return count Total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get paper metadata for a token
     * @param tokenId ID of the token
     * @return title Paper title
     * @return author Author name
     * @return affiliation Institution
     * @return ipfsHash IPFS hash
     * @return status Current status
     * @return mintedAt Timestamp when minted
     */
    function getPaperMetadata(uint256 tokenId)
        external
        view
        returns (
            string memory title,
            string memory author,
            string memory affiliation,
            string memory ipfsHash,
            Status status,
            uint256 mintedAt
        )
    {
        PaperMetadata memory paper = papers[tokenId];
        return (
            paper.title,
            paper.author,
            paper.affiliation,
            paper.ipfsHash,
            paper.status,
            paper.mintedAt
        );
    }

    /**
     * @notice Update royalty information
     * @dev Only callable by contract owner
     * @param receiver Address to receive royalties
     * @param feeNumerator Royalty fee in basis points (e.g., 500 = 5%)
     */
    function setRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // Override required functions

    /**
     * @notice Get token URI
     * @param tokenId ID of the token
     * @return URI string
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Check interface support
     * @param interfaceId Interface identifier
     * @return True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
