# Deployments

Network: QDay Aevum Testnet (chain ID 44005)

| Contract | Address | Deploy tx | Source commit |
| --- | --- | --- | --- |
| PayeeRegistry | [0x5d1fD27BFBfee52840A3d39C1E294F35A2e5fdc4](https://explorer-test.qday.info/address/0x5d1fD27BFBfee52840A3d39C1E294F35A2e5fdc4) | [0xb304dcc8...3513f1](https://explorer-test.qday.info/tx/0xb304dcc869a36b7bee40fe9a0dcf2bc9e756781db71a3879a4ead3aaa73513f1) | c22c907 |
| PayvantaPayables | [0xF2D56370EC36664Af5e22112b5bDb68B4Ac51D41](https://explorer-test.qday.info/address/0xF2D56370EC36664Af5e22112b5bDb68B4Ac51D41) | [0xf117551e...c0a403](https://explorer-test.qday.info/tx/0xf117551e34674ceffb0e535e43db703970e69d53e386e3561511b11555c0a403) | ae60afa |

Deployer: 0x3F728939915A790490A24B3832e4a92B16921a2a

## Live flow on Aevum testnet

Roles: owner `0x3F72...1a2a`, agent `0x8Ff5...f903`, payee Acme Ltd `0x5bA9...B675`.

| Step | Transaction |
| --- | --- |
| Acme registers in PayeeRegistry | [0x59fe7c93...e61e6c9](https://explorer-test.qday.info/tx/0x59fe7c932c2374f497007f0358e05741962621498ffda8ca6ad1d3bc0e61e6c9) |
| Verifier marks Acme verified | [0x5e7ae3ed...af7e0976](https://explorer-test.qday.info/tx/0x5e7ae3ed859e4e153ba2adb8908bb834b8c181ff93dc17cbef5e4da5af7e0976) |
| Owner approves 3 tUSD8 allowance | [0xfd041da9...65b9269bdff2](https://explorer-test.qday.info/tx/0xfd041da958b98d0091ddb9f8332c321252a1b8043348f1cc1b7b65b9269bdff2) |
| Owner sets agent policy (1 per payment, 2 per day, 7 days) | [0x4aa5628c...e3034f2fb7b](https://explorer-test.qday.info/tx/0x4aa5628c7deac7d77d3439408b7eede3d63d125324c7fe7c97248e3034f2fb7b) |
| Agent pays invoice-001 (1 tUSD8 to Acme) | [0xa172e9ec...d37d9e61](https://explorer-test.qday.info/tx/0xa172e9ec6b34294f8c446361debe4bc3576228d92d4f036401294b7cd37d9e61) |

Blocked attempts (simulated with `cast call`, all revert):

| Attempt | Result |
| --- | --- |
| Pay invoice-001 again | InvoiceAlreadyPaid |
| Pay 1.5 tUSD8 (cap is 1) | OverPerTxCap |
| Pay an unregistered address claiming to be Acme Ltd | PayeeNameMismatch |
