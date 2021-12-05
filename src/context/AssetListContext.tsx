import React, { createContext, useEffect, useMemo, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Token } from '@mithraic-labs/market-meta/dist/types';
import { getAssetsByNetwork } from '../utils/networkInfo';
import { useRecoilValue } from 'recoil';
import { activeNetwork } from '../recoil';

type TickerPair = {
  uAssetSymbol?: string;
  qAssetSymbol?: string;
};

type AssetListContext = {
  srmPublicKey: PublicKey | null;
  USDCPublicKey: PublicKey | null;
  USDCToken: Token | null;
  supportedAssets: Token[];
  setSupportedAssets: React.Dispatch<React.SetStateAction<Token[]>>;
  uAsset: Token | null;
  qAsset: Token | null;
  setUAsset: React.Dispatch<React.SetStateAction<Token | null>>;
  setQAsset: React.Dispatch<React.SetStateAction<Token | null>>;
  assetListLoading: boolean;
  tokenMap: Record<string, Token>;
};

const defaultAssetPairsByNetworkName: Record<string, TickerPair> = {
  Mainnet: {
    uAssetSymbol: 'BTC',
    qAssetSymbol: 'USDC',
  },
  Devnet: {
    uAssetSymbol: 'BTC',
    qAssetSymbol: 'USDC',
  },
  Testnet: {
    uAssetSymbol: 'SOL',
    qAssetSymbol: 'ABC',
  },
  localhost: {
    uAssetSymbol: 'BTC',
    qAssetSymbol: 'USDC',
  },
};

const AssetListContext = createContext<AssetListContext>({
  srmPublicKey: null,
  USDCPublicKey: null,
  USDCToken: null,
  supportedAssets: [],
  setSupportedAssets: () => {},
  uAsset: null,
  qAsset: null,
  setUAsset: () => {},
  setQAsset: () => {},
  assetListLoading: true,
  tokenMap: {},
});

const AssetListProvider: React.FC = ({ children }) => {
  const endpoint = useRecoilValue(activeNetwork);
  const [supportedAssets, setSupportedAssets] = useState<Token[]>([]);
  const [tokenMap, setTokenMap] = useState<Record<string, Token>>({});
  const [uAsset, setUAsset] = useState<Token | null>(null);
  const [qAsset, setQAsset] = useState<Token | null>(null);
  const [assetListLoading, setAssetListLoading] = useState(true);
  const srmPublicKey = useMemo(() => {
    const srm = supportedAssets.find((asset) => asset.tokenSymbol === 'SRM');
    return srm ? new PublicKey(srm.mintAddress) : null;
  }, [supportedAssets]);
  const [USDCPublicKey, USDCToken] = useMemo(() => {
    const usdc = supportedAssets.find((asset) => asset.tokenSymbol === 'USDC');
    return usdc ? [new PublicKey(usdc.mintAddress), usdc] : [null, null];
  }, [supportedAssets]);

  useEffect(() => {
    const setDefaultAssets = (assets: Token[]) => {
      if (assets && assets.length > 1) {
        const defaultAssetPair =
          defaultAssetPairsByNetworkName[endpoint.name] || {};
        let defaultUAsset: Token | null = null;
        let defaultQAsset: Token | null = null;
        assets.forEach((asset) => {
          if (asset.tokenSymbol === defaultAssetPair.uAssetSymbol) {
            defaultUAsset = asset;
          }
          if (asset.tokenSymbol === defaultAssetPair.qAssetSymbol) {
            defaultQAsset = asset;
          }
        });
        if (defaultUAsset && defaultQAsset) {
          setUAsset(defaultUAsset);
          setQAsset(defaultQAsset);
        }
      } else {
        setUAsset(null);
        setQAsset(null);
      }
    };

    const basicAssets = getAssetsByNetwork(endpoint.name);
    setSupportedAssets(basicAssets);
    setDefaultAssets(basicAssets);
    setAssetListLoading(false);
    const _tokenMap = basicAssets.reduce((acc, token) => {
      acc[token.mintAddress] = token;
      return acc;
    }, {});
    setTokenMap(_tokenMap);
  }, [endpoint.name]);

  const value = {
    supportedAssets,
    setSupportedAssets,
    srmPublicKey,
    USDCPublicKey,
    USDCToken,
    uAsset,
    qAsset,
    setUAsset,
    setQAsset,
    assetListLoading,
    tokenMap,
  };

  return (
    <AssetListContext.Provider value={value}>
      {children}
    </AssetListContext.Provider>
  );
};

export { AssetListContext, AssetListProvider };
