// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title BUToken
 * @dev Implementation of the Barley Unit (BU) Token.
 * This is a non-transferable token (Soulbound) representing verified resilience.
 * It functions as "Natural Capital Collateral".
 */
contract BUToken {
    string public name = "Kushim Barley Unit";
    string public symbol = "BU";

    // Mapping from Entity DID to BU Balance
    mapping(string => uint256) private _balances;

    // Mapping to track if a specific claim_id has already been minted to prevent double spending
    mapping(uint256 => bool) public processedClaims;

    // Address of the KUSHIM Oracle/System that is allowed to mint
    address public oracleAddress;

    event BUMinted(string indexed entityDid, uint256 indexed claimId, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Caller is not the authorized Oracle");
        _;
    }

    constructor() {
        oracleAddress = msg.sender;
    }

    /**
     * @dev Mints BU tokens for a verified claim.
     * Can only be called by the KUSHIM Oracle after off-chain verification.
     * 
     * @param entityDid The DID of the entity receiving the tokens (e.g., "did:kushim:entity-123").
     * @param claimId The unique ID of the verified claim from the KUSHIM DB.
     * @param amount The Barley Unit value of the claim (e.g., NRP score).
     */
    function mint_BU_token(string memory entityDid, uint256 claimId, uint256 amount) public onlyOracle {
        require(!processedClaims[claimId], "Claim ID already processed");
        require(amount > 0, "Amount must be greater than 0");

        _balances[entityDid] += amount;
        processedClaims[claimId] = true;

        emit BUMinted(entityDid, claimId, amount);
    }

    /**
     * @dev Verifies the BU balance for a specific entity.
     * Publicly accessible for banks/insurers.
     * 
     * @param entityDid The DID of the entity to query.
     * @return The total BU balance (Resilience Capital).
     */
    function verify_BU_balance(string memory entityDid) public view returns (uint256) {
        return _balances[entityDid];
    }

    /**
     * @dev Updates the authorized Oracle address.
     */
    function updateOracle(address newOracle) public onlyOracle {
        oracleAddress = newOracle;
    }
}
