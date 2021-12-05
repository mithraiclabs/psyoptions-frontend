import { useRecoilTransaction_UNSTABLE } from 'recoil';
import { Network } from '../../utils/networkInfo';
import {
  expirationUnixTimestamp,
  optionsIds,
  optionsMap,
  quoteMint,
  underlyingAmountPerContract,
  underlyingMint,
} from '../options';
import { splTokenMintInfoList, splTokenMintInfoMap } from '../splTokens';
import { activeNetwork } from './atoms';

/**
 * Update the active network and reset all necessary state upon
 * network change.
 */
export const useUpdateNetwork = () =>
  useRecoilTransaction_UNSTABLE<[Network]>(
    ({ get, reset, set }) =>
      (network) => {
        const currentNetwork = get(activeNetwork);
        if (currentNetwork === network) {
          // short circuit when network is the same
          return;
        }
        set(activeNetwork, network);
        // reset all of the cached SPL Token MintInfos when changing the network.
        const _splTokenMintInfoList = get(splTokenMintInfoList);
        _splTokenMintInfoList.forEach((key) => reset(splTokenMintInfoMap(key)));
        // reset all of the options meta data from the previous network
        const _optionIds = get(optionsIds);
        _optionIds.forEach((id) => reset(optionsMap(id)));
        reset(optionsIds);
        reset(underlyingMint);
        reset(quoteMint);
        reset(expirationUnixTimestamp);
        reset(underlyingAmountPerContract);
      },
    [],
  );
