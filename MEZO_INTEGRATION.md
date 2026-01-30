# Mezo Integration Requirements

This document contains all the technical details needed to integrate Yield Pulse with Mezo's blockchain.

---

## 1. Network Configuration

### Mainnet
| Parameter | Value |
|-----------|-------|
| Network Name | Mezo Mainnet |
| **Chain ID** | `31612` |
| Native Currency | BTC |
| Decimals | 18 |
| Block Explorer | https://explorer.mezo.org/ |

### RPC Endpoints (Mainnet)
| Provider | HTTPS | WSS |
|----------|-------|-----|
| Boar | `https://rpc-http.mezo.boar.network` | `wss://rpc-ws.mezo.boar.network` |
| Imperator | `https://rpc_evm-mezo.imperator.co` | `wss://ws_evm-mezo.imperator.co` |
| Validation Cloud | `https://mainnet.mezo.public.validationcloud.io` | `wss://mainnet.mezo.public.validationcloud.io` |
| dRPC | `https://mezo.drpc.org` | `wss://mezo.drpc.org` |

### Testnet
| Parameter | Value |
|-----------|-------|
| Network Name | Mezo Testnet |
| **Chain ID** | `31611` |
| RPC Endpoint | `https://rpc.test.mezo.org` |
| Block Explorer | https://explorer.test.mezo.org/ |

---

## 2. Token Contracts (Mezo Mainnet)

### Native & Stablecoin
| Token | Address |
|-------|---------|
| BTC (Native) | `0x7b7C000000000000000000000000000000000000` |
| MUSD | `0xdD468A1DDc392dcdbEf6db6e34E89AA338F9F186` |

### Bridged BTC Variants
| Token | Mezo Address |
|-------|--------------|
| mcbBTC | `0x6a7CD8E1384d49f502b4A4CE9aC9eb320835c5d7` |
| mFBTC | `0x812fcC0Bb8C207Fd8D6165a7a1173037F43B2dB8` |
| mSolvBTC | `0xa10aD2570ea7b93d19fDae6Bd7189fF4929Bc747` |
| mswBTC | `0x29fA8F46CBB9562b87773c8f50a7F9F27178261c` |
| mxSolvBTC | `0xdF708431162Ba247dDaE362D2c919e0fbAfcf9DE` |

### Bridged Stablecoins
| Token | Mezo Address |
|-------|--------------|
| mUSDC | `0x04671C72Aab5AC02A03c1098314b1BB6B560c197` |
| mUSDT | `0xeB5a5d39dE4Ea42C2Aa6A57EcA2894376683bB8E` |
| mDAI | `0x1531b6e3d51BF80f634957dF81A990B92dA4b154` |
| mUSDe | `0xdf6542260a9F768f07030E4895083F804241F4C4` |

### Other Tokens
| Token | Mezo Address |
|-------|--------------|
| mT (Threshold) | `0xaaC423eDC4E3ee9ef81517e8093d52737165b71F` |

---

## 3. Pool Contracts (DEX/LP)

| Pool | Address |
|------|---------|
| PoolFactory | `0x83FE469C636C4081b87bA5b3Ae9991c6Ed104248` |
| MUSD/BTC Pool | `0x52e604c44417233b6CcEDDDc0d640A405Caacefb` |
| MUSD/mUSDC Pool | `0xEd812AEc0Fecc8fD882Ac3eccC43f3aA80A6c356` |
| MUSD/mUSDT Pool | `0x10906a9E9215939561597b4C8e4b98F93c02031A` |

---

## 4. MUSD System Contracts

| Contract | Address |
|----------|---------|
| ActivePool | `0x3012C2fE1240e3754E5C200A0946bb0E07474876` |
| DefaultPool | `0xE4B5913C0c82dB2eFC553b95c0173efb90a07c8B` |
| CollSurplusPool | `0xBF51807ACb3394B8550f0554FB9098856Ef5F491` |
| GasPool | `0x3EB418BdBE95b4b9cf465ecfBD8424685ACD1Bc1` |

---

## 5. Portal/Bridge Contracts (Ethereum)

| Contract | Address |
|----------|---------|
| Portal Proxy | `0xAB13B8eecf5AA2460841d75da5d5D861fD5B8A39` |
| BitcoinDepositor Proxy | `0x1D50D75933b7b7C8AD94dbfb748B5756E3889C24` |
| MezoBridge Proxy | `0xF6680EA3b480cA2b72D96ea13cCAF2cFd8e6908c` |
| tBTC | `0x18084fbA666a33d37592fA2633fD49a74DD93a88` |
| WBTC | `0x2260fac5e5542a773aa44fbcfedf7c193bc2c599` |

---

## 6. Key Features to Integrate

### veBTC (Vote-Escrowed BTC)
- Lock BTC to receive veBTC
- Max lock period: 30 days
- Earn BTC-denominated yield from network fees
- Can amplify earnings up to 5x by locking MEZO token

### Pools (Tigris DEX)
- Solidly-inspired DEX
- Liquidity provision for yield
- GitHub: https://github.com/mezo-org/tigris

### MUSD
- Bitcoin-backed stablecoin
- Borrow against BTC collateral
- GitHub: https://github.com/mezo-org/musd

---

## 7. Useful Tools & Resources

- **Block Explorer**: https://explorer.mezo.org/
- **Mezo Tools (3rd party)**: https://mezotools.cc - Monitor Troves, liquidations, prices
- **GitHub Repos**:
  - Main client: https://github.com/mezo-org/mezod
  - MUSD: https://github.com/mezo-org/musd
  - DEX (Tigris): https://github.com/mezo-org/tigris
  - Documentation: https://github.com/mezo-org/documentation

---

## 8. Next Steps for Yield Pulse Integration

1. **Update chain config** with correct Chain ID (31612) and RPC
2. **Read user balances** from token contracts
3. **Read pool positions** from Pool contracts
4. **Read veBTC locks** from veBTC contract (need to find exact address)
5. **Calculate PnL** by tracking deposits vs current values
6. **Index historical data** for charts

---

*Source: [Mezo Documentation](https://mezo.org/docs/users)*
