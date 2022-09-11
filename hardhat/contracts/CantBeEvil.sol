// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import {LicenseVersion, CantBeEvil} from "@a16z/contracts/licenses/CantBeEvil.sol";
import {TermsableNoToken} from "@polydocs/contracts/contracts/termsable/TermsableNoToken.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// this contract inherits getLicenseURI() and getLicenseName() from the CantBeEvil contract

contract NonEvilToken is ERC721, Ownable, CantBeEvil, TermsableNoToken {
    using Strings for uint256;
    string RENDERER = "https://hellosign-bridge.polydocs.xyz";

    constructor(LicenseVersion _version, address _newOwner)
        ERC721("HelloToken", "NET")
        CantBeEvil(_version)
    {
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
        override(CantBeEvil, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
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
}
