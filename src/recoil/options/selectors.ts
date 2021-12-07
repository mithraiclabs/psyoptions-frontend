import { OptionMarketWithKey } from '@mithraic-labs/psy-american';
import BN from 'bn.js';
import { DefaultValue, GetRecoilValue, selector, SetRecoilState } from 'recoil';
import _uniqby from 'lodash.uniqby';
import {
  defaultUnderlying,
  expirationUnixTimestamp,
  optionsIds,
  optionsMap,
  quoteMint,
  underlyingAmountPerContract,
  underlyingMint,
} from './options';
import { PublicKey } from '@solana/web3.js';

export const selectAllOptions = selector<OptionMarketWithKey[]>({
  key: 'selectAllOptions',
  get: ({ get }) =>
    get(optionsIds)
      .map((optionKey) => get(optionsMap(optionKey)))
      .filter((o) => !!o) as OptionMarketWithKey[],
});

/**
 * Get available expirations based on the inputed assets.
 */
const getExpirationsForPair = ({
  get,
  _quoteMint,
  _underlyingMint,
}: {
  get: GetRecoilValue;
  _quoteMint: PublicKey | null;
  _underlyingMint: PublicKey | null;
}): BN[] => {
  const nowInSeconds = Date.now() / 1000;

  const _optionsIds = get(optionsIds);
  const expirations = _optionsIds.reduce((acc, publicKeyStr) => {
    const option = get(optionsMap(publicKeyStr));
    if (
      option &&
      option.expirationUnixTimestamp.toNumber() > nowInSeconds &&
      _underlyingMint &&
      _quoteMint &&
      // must check for all permutations to get Calls and Puts
      (option.underlyingAssetMint.equals(_underlyingMint) ||
        option.underlyingAssetMint.equals(_quoteMint)) &&
      (option.quoteAssetMint.equals(_quoteMint) ||
        option.quoteAssetMint.equals(_underlyingMint))
    ) {
      acc.push(option.expirationUnixTimestamp);
    }
    return acc;
  }, [] as BN[]);

  return _uniqby(expirations, (exp) => exp.toNumber()).sort((a, b) =>
    a.sub(b).toNumber(),
  );
};

/**
 * select future expiration dates by the underlying and quote mints
 */
export const selectFutureExpirationsByUnderlyingAndQuote = selector({
  key: 'selectFutureExpirationsByUnderlyingAndQuote',
  get: ({ get }) => {
    const _underlyingMint = get(underlyingMint);
    const _quoteMint = get(quoteMint);
    return getExpirationsForPair({ get, _quoteMint, _underlyingMint });
  },
});

/**
 * Utility function for reducing options to a list of underlying amounts per
 * contract (aka contract size) based on the state params.
 */
const getUnderlyingAmountPerOptionExpirationUnderlyingQuote = ({
  expiration,
  underlyingMintOverride,
  get,
}: {
  get: GetRecoilValue;
  expiration: BN;
  underlyingMintOverride?: PublicKey | null;
}) => {
  const _underlyingMint = get(underlyingMint);
  const __underlyingMint = underlyingMintOverride ?? _underlyingMint;
  const _quoteMint = get(quoteMint);
  const _optionsIds = get(optionsIds);
  const expirations = _optionsIds.reduce((acc, publicKeyStr) => {
    const option = get(optionsMap(publicKeyStr));
    if (
      option &&
      option.expirationUnixTimestamp.eq(expiration) &&
      __underlyingMint &&
      _quoteMint &&
      // must check for all permutations to get Calls and Puts
      (option.underlyingAssetMint.equals(__underlyingMint) ||
        option.underlyingAssetMint.equals(_quoteMint)) &&
      (option.quoteAssetMint.equals(_quoteMint) ||
        option.quoteAssetMint.equals(__underlyingMint))
    ) {
      // Normalize whether it's a Call or Put from the current state.
      // This prevents contract size duplication across the permutations.
      const normalizedUnderlyingAmountPerContract =
        option.underlyingAssetMint.equals(__underlyingMint)
          ? option.underlyingAmountPerContract
          : option.quoteAmountPerContract;
      acc.push(normalizedUnderlyingAmountPerContract);
    }
    return acc;
  }, [] as BN[]);

  return _uniqby(expirations, (exp) => exp.toString()).sort((a, b) =>
    a.toString() > b.toString() ? 1 : -1,
  );
};

/**
 * Update the expiration time stamp. Also update the underlyingAmount
 * if it needs to change along with the expiration.
 */
const setExpirationAndMaybeUnderlyingAmount = ({
  get,
  set,
  newValue,
  _underlyingMint,
}: {
  get: GetRecoilValue;
  newValue: BN | DefaultValue;
  set: SetRecoilState;
  _underlyingMint?: PublicKey | null;
}) => {
  set(expirationUnixTimestamp, newValue);
  if (newValue instanceof DefaultValue) {
    return set(underlyingAmountPerContract, defaultUnderlying);
  }

  const _underlyingAmountPerContract = get(underlyingAmountPerContract);
  const _underlyingAmountsPerContract =
    getUnderlyingAmountPerOptionExpirationUnderlyingQuote({
      get,
      expiration: newValue,
      underlyingMintOverride: _underlyingMint,
    });
  if (!_underlyingAmountsPerContract.length) {
    return;
  }
  const index = _underlyingAmountsPerContract.findIndex((v) =>
    v.eq(_underlyingAmountPerContract),
  );
  if (index !== -1) {
    // contract size exists after updating expiration, no
    // need to update contract size.
    set(underlyingAmountPerContract, _underlyingAmountsPerContract[index]);
    return;
  }
  set(underlyingAmountPerContract, _underlyingAmountsPerContract[0]);
};

export const selectExpirationWithUnderlyingAmount = selector<BN>({
  key: 'selectExpirationWithUnderlyingAmount',
  get: ({ get }) => get(expirationUnixTimestamp),
  // set new expriation value and maybe update the contract size.
  set: ({ get, set }, newValue) =>
    setExpirationAndMaybeUnderlyingAmount({ get, newValue, set }),
});

/**
 * select underlying amount for option based on the selecting underlying mint,
 * quote mint, and expiration.
 *
 * Sorts the sizes in descending order.
 */
export const selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote =
  selector({
    key: 'selectUnderlyingAmountPerOptionByExpirationUnderlyingQuote',
    get: ({ get }) =>
      getUnderlyingAmountPerOptionExpirationUnderlyingQuote({
        expiration: get(expirationUnixTimestamp),
        get,
      }),
  });

/**
 * Read/Write selector for `underlyingMint` that updates dependent state.
 * Mainly used for Markets page.
 */
export const selectUnderlyingMintWithSideEffects = selector<PublicKey | null>({
  key: 'selectUnderlyingMintWithSideEffects',
  get: ({ get }) => get(underlyingMint),
  set: ({ get, set }, newValue) => {
    set(underlyingMint, newValue);
    if (newValue instanceof DefaultValue) {
      return;
    }
    const expiration = get(expirationUnixTimestamp);
    const _quoteMint = get(quoteMint);
    const expirationsForPair = getExpirationsForPair({
      get,
      _quoteMint,
      _underlyingMint: newValue,
    });
    const expirationExists = !!expirationsForPair.find((e) => e.eq(expiration));
    // Note that we want to always run it through this setter, even if the current
    // expiration exists. This will update the underlying amount if needed. When the
    // expiration does not exist for the new pair, then we simply update to the first
    // available expiration.
    return setExpirationAndMaybeUnderlyingAmount({
      get,
      newValue: expirationExists ? expiration : expirationsForPair[0],
      set,
      _underlyingMint: newValue,
    });
  },
});
