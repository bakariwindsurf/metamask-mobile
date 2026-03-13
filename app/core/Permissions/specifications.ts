///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
import {
  caveatSpecifications as snapsCaveatsSpecifications,
  endowmentCaveatSpecifications as snapsEndowmentCaveatSpecifications,
} from '@metamask/snaps-rpc-methods';
///: END:ONLY_INCLUDE_IF
import { RestrictedMethods } from './constants';
import {
  caip25CaveatBuilder,
  Caip25CaveatType,
  caip25EndowmentBuilder,
  createCaip25Caveat,
  InternalScopeString,
} from '@metamask/chain-agnostic-permission';
import type { InternalAccount } from '@metamask/keyring-api';
import type { Json, CaipAccountId } from '@metamask/utils';

interface CaveatSpecificationOptions {
  listAccounts?: () => InternalAccount[];
  findNetworkClientIdByChainId?: (chainId: `0x${string}`) => string;
  isNonEvmScopeSupported?: (scope: InternalScopeString) => Json | unknown;
  getNonEvmAccountAddresses?: (scope: InternalScopeString) => CaipAccountId[] | unknown;
}
export const PermissionKeys = Object.freeze({
  ...RestrictedMethods,
  permittedChains: 'endowment:permitted-chains',
});

export const CaveatFactories = Object.freeze({
  [Caip25CaveatType]: createCaip25Caveat,
});

export const getCaveatSpecifications = ({
  listAccounts,
  findNetworkClientIdByChainId,
  isNonEvmScopeSupported,
  getNonEvmAccountAddresses,
}: CaveatSpecificationOptions) => ({
  [Caip25CaveatType]: caip25CaveatBuilder({
    listAccounts,
    findNetworkClientIdByChainId,
    isNonEvmScopeSupported,
    getNonEvmAccountAddresses,
  }),
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  ...snapsCaveatsSpecifications,
  ...snapsEndowmentCaveatSpecifications,
  ///: END:ONLY_INCLUDE_IF
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getPermissionSpecifications = (..._args: any[]) => ({
  [caip25EndowmentBuilder.targetName]:
    caip25EndowmentBuilder.specificationBuilder({}),
});

export const unrestrictedMethods = Object.freeze([
  'eth_blockNumber',
  'eth_call',
  'eth_decrypt',
  'eth_estimateGas',
  'eth_feeHistory',
  'eth_gasPrice',
  'eth_getBalance',
  'eth_getBlockByHash',
  'eth_getBlockByNumber',
  'eth_getBlockTransactionCountByHash',
  'eth_getBlockTransactionCountByNumber',
  'eth_getCode',
  'eth_getEncryptionPublicKey',
  'eth_getFilterChanges',
  'eth_getFilterLogs',
  'eth_getLogs',
  'eth_getProof',
  'eth_getStorageAt',
  'eth_getTransactionCount',
  'eth_getTransactionReceipt',
  'eth_getUncleByBlockHashAndIndex',
  'eth_getUncleByBlockNumberAndIndex',
  'eth_getUncleCountByBlockHash',
  'eth_getUncleCountByBlockNumber',
  'eth_getWork',
  'eth_newBlockFilter',
  'eth_newFilter',
  'eth_newPendingTransactionFilter',
  'eth_protocolVersion',
  'eth_sendRawTransaction',
  'eth_signTypedData_v1',
  'eth_submitHashrate',
  'eth_submitWork',
  'eth_syncing',
  'eth_uninstallFilter',
  'metamask_watchAsset',
  'net_peerCount',
  'web3_sha3',
  // Define unrestricted methods below to bypass PermissionController. These are eventually handled by RPCMethodMiddleware (User facing RPC methods)
  'wallet_getPermissions',
  'wallet_requestPermissions',
  'wallet_revokePermissions',
  'eth_getTransactionByHash',
  'eth_getTransactionByBlockHashAndIndex',
  'eth_getTransactionByBlockNumberAndIndex',
  'eth_chainId',
  'eth_hashrate',
  'eth_mining',
  'net_listening',
  'net_version',
  'eth_requestAccounts',
  'eth_coinbase',
  'parity_defaultAccount',
  'eth_sendTransaction',
  'personal_sign',
  'personal_ecRecover',
  'parity_checkRequest',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'web3_clientVersion',
  'wallet_scanQRCode',
  'wallet_watchAsset',
  'metamask_removeFavorite',
  'metamask_showTutorial',
  'metamask_showAutocomplete',
  'metamask_injectHomepageScripts',
  'metamask_getProviderState',
  'metamask_logWeb3ShimUsage',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'wallet_sendCalls',
  'wallet_getCallsStatus',
  'wallet_getCapabilities',
  ///: BEGIN:ONLY_INCLUDE_IF(preinstalled-snaps,external-snaps)
  'wallet_getAllSnaps',
  'wallet_getSnaps',
  'wallet_requestSnaps',
  'wallet_invokeSnap',
  'wallet_invokeKeyring',
  'snap_getClientStatus',
  'snap_clearState',
  'snap_endTrace',
  'snap_getFile',
  'snap_getState',
  'snap_listEntropySources',
  'snap_createInterface',
  'snap_updateInterface',
  'snap_getInterfaceState',
  'snap_getInterfaceContext',
  'snap_resolveInterface',
  'snap_setState',
  'snap_scheduleBackgroundEvent',
  'snap_startTrace',
  'snap_trackError',
  'snap_trackEvent',
  'snap_cancelBackgroundEvent',
  'snap_getBackgroundEvents',
  'snap_experimentalProviderRequest',
  'snap_openWebSocket',
  'snap_sendWebSocketMessage',
  'snap_closeWebSocket',
  'snap_getWebSockets',
  ///: END:ONLY_INCLUDE_IF
]);
