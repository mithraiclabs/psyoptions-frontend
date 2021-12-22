import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import {
  expirationUnixTimestamp,
  lastOptionParametersByAssetPair,
  quoteMint,
  underlyingAmountPerContract,
  underlyingMint,
} from './atoms';

/**
 * Watch changes to params on Markets page and update a state that's used
 * to reload when the asset pair changes.
 */
export const useUpdateLastOptionParamsByAssetPair = () => {
  const [, setLastOptionParametersByAssetPair] = useRecoilState(
    lastOptionParametersByAssetPair,
  );
  const _underlyingMint = useRecoilValue(underlyingMint);
  const _quoteMint = useRecoilValue(quoteMint);
  const _expirationUnixTimestamp = useRecoilValue(expirationUnixTimestamp);
  const _underlyingAmountPerContract = useRecoilValue(
    underlyingAmountPerContract,
  );

  useEffect(() => {
    if (!_underlyingMint || !_quoteMint) {
      // do nothing if either underlying or quote mint do not exist
      return;
    }

    setLastOptionParametersByAssetPair((curVal) => ({
      ...curVal,
      [`${_underlyingMint}-${_quoteMint}`]: {
        expiration: _expirationUnixTimestamp,
        underlyingAmountPerContract: _underlyingAmountPerContract,
      },
    }));
  }, [
    _expirationUnixTimestamp,
    _quoteMint,
    _underlyingAmountPerContract,
    _underlyingMint,
    setLastOptionParametersByAssetPair,
  ]);
};
