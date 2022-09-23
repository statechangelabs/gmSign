# gmSign - Hellosign 2022 Hackathon submission

## Inspiration

Smart contracts are increasingly used for managing the allocation of digital assets. These assets are more complex than the cash or deeds we sometimes use for analogies. Intellectual property involves rights and responsibilities. Financial instruments require acceptance on both sides. Communities need agreement on government by norms and rules.

These agreements need to be clear, binding, and reside where they do business - on the decentralized web.

gmSign connects Hellodocs with decentralized applications by enabling signatures over the HelloSign API which, on callback, makes a gasless record of that signature on-chain so that there is clarity as to who signed which agreement when.
## What it does

Our implementation of gmSign has three parts.

First, we created a micro-app at sign.gmsign.xyz that allows one to check whether they have agreed to the terms of a given smart contract. This contract works on the popular [Polygon](https://polygon.technology) blockchain. Polygon is favored by a lot of decentralized apps because of its green track record and low gas fees. 

Second, we created a no-code back-end using [Xano](https://xano.com) that connects the app to the Hellosign API and also receives signature notification from Hellosign. The metadata in the signature triggers the back-end to write confirmation of the signature to the blockchain.

As a reward, the user gets their very own, customized non-fungible token (NFT) on the Polygon blockchain generated with [Placid](https://placid.app). This token is even viewable on OpenSea! 

Third, we created an administrative application at https://admin.gmsign.xyz to let others build their own NFT-generating smart contracts that use these same dapps. One can pick any of the six Can't Be Evil licenses recently developed by the [A16Z Crypto](https://a16zcrypto.com) fund as a contract to sign. 

Finally, we distribute the code of the smart contract we used as a public good so other people can stack on top of it or modify in a way that helps them reduce their intellectual property and compliance risks on the decentralized web. 
## How we built it

Our first mission was to bring Hellosign to Web3. We connected with a Polygon blockchain using Ethers.js and added code to connect Hellpsign.

We originally built using a serverless back-end on NodeJS and the 6.0 version of the HelloSign SDK. 

But we saw a bigger opportunity in linking Hellosign to meaningful no-code using Xano. Using Hellosign entirely through the API via the REST interface was clear and allowed us to make the product and process even more accessible to the kind of business user who will be concerned with compliance and web3. 

Using Xano we could also make the whole experience gasless. Now people could get their NFT without ever having to acquire native token to fund a transaction. We just take care of it through the Ethers support in Xano and over the Hellosign API. 

## Challenges we ran into and Accomplishments that we're proud of

Connecting Hellosign with A16Z best-in-class licenses with the decentralized web all using a no-code backend was a significant technical challenge that unleashed a lot of value.

Promoting certain licenses helps further standards so people can be less afraid they are signing some agreement that takes away their first-born children. 

Using Hellosign for web3 agreements employs a comforting brand to manage risk while putting the source of truth in an immutable, shared truth data store. 

The no-code backend became a low-code backend as we employed small javascript "lambdas" for managing the web3 communication using the new Ethers.js support on Xano. 

## What we learned

The opportunity to connect a service like Hellosign to an enduring data store like the decentralized ledger is enormous. One gets to maximize confidence in both the process and the record. 

Once we opened to no-code, the speed at which we could develop new functionality amazed us. At a late stage we added support for [Placid.app](https://placid.app) for generating NFT assets specific to individuals and the contracts they signed. This made the contract creator even more fun - the contract decides what the art will be for the signing dapp as well as the NFT image behind the scenes.

## What's next for gmSign

We are just getting going. As a team we are excited about the potential for legaltech and risk management products in the decentralized web. The model of no-code is composition, which lets us take the best of "web2" and "web3" to create maximum value for brands and customers. As a team we are pursuing more projects at this intersection of important use cases, web3 and no-code. 

We can't wait to see what's next. 
