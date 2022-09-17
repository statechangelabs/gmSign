// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {LicenseVersion, CantBeEvil} from "@a16z/contracts/licenses/CantBeEvil.sol";
import {TermsableNoToken} from "@polydocs/contracts/contracts/termsable/TermsableNoToken.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// this contract inherits getLicenseURI() and getLicenseName() from the CantBeEvil contract

contract NonEvilToken is
    Ownable,
    CantBeEvil,
    TermsableNoToken,
    ERC721URIStorage,
    ERC2981
{
    using Strings for uint256;
    string RENDERER = "https://hellosign-bridge.polydocs.xyz";

    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds; // Changed to public to test for the timebeing
    string private _uri;
    event MintNFT(address sender, uint256 tokenId);
    mapping(address => bool) private _minters;

    constructor(
        LicenseVersion _version,
        address _newOwner,
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) CantBeEvil(_version) {
        _setGlobalRenderer(RENDERER);
        _setGlobalTemplate(
            string.concat(_BASE_LICENSE_URI, uint256(licenseVersion).toString())
        );
        _addMetaSigner(msg.sender);
        _transferOwnership(_newOwner);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(CantBeEvil, ERC721, ERC2981)
        returns (bool)
    {
        return
            CantBeEvil.supportsInterface(interfaceId) ||
            ERC721.supportsInterface(interfaceId) ||
            ERC2981.supportsInterface(interfaceId);
    }

    function safeMint(address to, uint256 tokenId) public onlyMetaSigner {
        _safeMint(to, tokenId);
    }

    function _termsUrlWithPrefix(string memory)
        internal
        view
        override
        returns (string memory _termsURL)
    {
        _termsURL = string(
            abi.encodePacked(
                _globalRenderer,
                "/#/",
                _globalDocTemplate,
                "::",
                // Strings.toString(block.number),
                // "::",
                Strings.toString(block.chainid),
                "::",
                Strings.toHexString(uint160(address(this)), 20),
                "::",
                Strings.toString(_lastTermChange)
            )
        );
    }

    function acceptTermsFor(
        address _signer,
        string memory _signatureUrl,
        bytes memory _UNUSED // We ignore unused atm
    ) external override onlyMetaSigner {
        //bytes32 hash = ECDSA.toEthSignedMessageHash(bytes(_json));
        // address _checkedSigner = ECDSA.recover(hash, _signature);
        // require(_checkedSigner == _signer);
        _acceptTerms(_signer, _signatureUrl);
    }

    function mint(string memory _tokenURI)
        public
        onlyMetaSigner
        returns (uint256)
    {
        require(_acceptedTerms(_msgSender()), "Terms not accepted");
        uint256 newItemId = _tokenIds.current();

        _safeMint(msg.sender, newItemId);

        _setTokenURI(newItemId, _tokenURI);

        _tokenIds.increment();

        emit MintNFT(msg.sender, newItemId);
        return newItemId;
    }

    function mintFor(string memory _tokenURI, address _to)
        public
        onlyMetaSigner
        returns (uint256)
    {
        //require(isMinter(_to), "Not a minter");
        require(_acceptedTerms(_to), "Terms not accepted");
        uint256 newItemId = _tokenIds.current();

        _safeMint(_to, newItemId);
        _setTokenURI(newItemId, _tokenURI);
        _tokenIds.increment();
        emit MintNFT(_to, newItemId);
        return newItemId;
    }
}
