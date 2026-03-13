import { equal } from 'uri-js';
import { InteractionManager } from 'react-native';
import { ChainId } from '@metamask/controller-utils';
import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { MetaMetricsEvents, MetaMetrics } from '../../core/Analytics';
import { MetricsEventBuilder } from '../../core/Analytics/MetricsEventBuilder';
import {
  selectEvmChainId,
  selectEvmNetworkConfigurationsByChainId,
} from '../../selectors/networkController';
import { store } from '../../store';
import checkSafeNetwork from './networkChecker.util';
import {
  validateAddEthereumChainParams,
  validateRpcEndpoint,
  switchToNetwork,
} from './lib/ethereum-chain-utils';
import { getDecimalChainId } from '../../util/networks';
import { RpcEndpointType } from '@metamask/network-controller';
import { addItemToChainIdList } from '../../util/metrics/MultichainAPI/networkMetricUtils';

const waitForInteraction = async (): Promise<void> =>
  new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve();
    });
  });

// Utility function to find or add an item in an array and return the updated array and index
const addOrUpdateIndex = <T>(array: T[], value: T, comparator: (item: T) => boolean): { updatedArray: T[]; index: number } => {
  const index = array.findIndex(comparator);
  if (index === -1) {
    return {
      updatedArray: [...array, value],
      index: array.length,
    };
  }
  return { updatedArray: array, index };
};

/**
 * Add chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns {Nothing}.
 */
interface WalletAddEthereumChainParams {
  req: { params: unknown; origin?: string };
  res: { result: unknown };
  requestUserApproval: (args: { type: string; requestData: Record<string, unknown> }) => Promise<void>;
  analytics: Record<string, unknown>;
  hooks: {
    getCurrentChainIdForDomain: (origin: string) => string;
    getNetworkConfigurationByChainId: (chainId: string) => Record<string, unknown> | undefined;
    getCaveat: (...args: unknown[]) => unknown;
    requestPermittedChainsPermissionIncrementalForOrigin: (args: Record<string, unknown>) => Promise<void>;
    hasApprovalRequestsForOrigin: (...args: unknown[]) => boolean;
  };
}

export const wallet_addEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletAddEthereumChainParams): Promise<void> => {
  const {
    NetworkController,
    MultichainNetworkController,
    ApprovalController,
    PermissionController,
    SelectedNetworkController,
  } = Engine.context;

  const { origin } = req;
  const params = validateAddEthereumChainParams(req.params);

  const {
    chainId,
    chainName,
    firstValidRPCUrl,
    firstValidBlockExplorerUrl,
    ticker,
  } = params;

  const switchToNetworkAndMetrics = async (network: Record<string, unknown>): Promise<void> => {
    const rpcEndpoints = network.rpcEndpoints as { url: string; networkClientId: string }[];
    const defaultRpcEndpointIndex = network.defaultRpcEndpointIndex as number;
    const { networkClientId } = rpcEndpoints[defaultRpcEndpointIndex];

    const existingNetwork = hooks.getNetworkConfigurationByChainId(chainId as string) as Record<string, unknown> | undefined;
    const existingRpcEndpoints = (existingNetwork?.rpcEndpoints ?? []) as { url: string }[];
    const rpcIndex = existingRpcEndpoints.findIndex(({ url }) =>
      equal(url, firstValidRPCUrl as string),
    );

    const existingBlockExplorerUrls = (existingNetwork?.blockExplorerUrls ?? []) as string[];
    const blockExplorerIndex = firstValidBlockExplorerUrl
      ? existingBlockExplorerUrls.findIndex((url) =>
          equal(url, firstValidBlockExplorerUrl as string),
        )
      : undefined;

    const shouldAddOrUpdateNetwork =
      !existingNetwork ||
      rpcIndex !== (existingNetwork.defaultRpcEndpointIndex as number) ||
      (firstValidBlockExplorerUrl &&
        blockExplorerIndex !== (existingNetwork.defaultBlockExplorerUrlIndex as number));

    await switchToNetwork({
      network: [networkClientId, network],
      chainId,
      requestUserApproval,
      analytics,
      origin,
      autoApprove: shouldAddOrUpdateNetwork,
      hooks,
    });
  };

  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(
    store.getState(),
  );

  const existingNetworkConfiguration = Object.values(
    networkConfigurations,
  ).find((networkConfiguration) => networkConfiguration.chainId === chainId);

  const existingNetworkConfigurationHasRpcEndpoint =
    existingNetworkConfiguration?.rpcEndpoints.some(
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

  // If the network already exists and the RPC URL is the same, perform a network switch only
  if (
    existingNetworkConfiguration &&
    existingNetworkConfigurationHasRpcEndpoint
  ) {
    const rpcResult = addOrUpdateIndex(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as (typeof existingNetworkConfiguration.rpcEndpoints)[number],
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    switchToNetworkAndMetrics({
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
    } as unknown as Record<string, unknown>);

    res.result = null;
    return;
  }

  await validateRpcEndpoint(firstValidRPCUrl as string, chainId as string);
  const requestData: Record<string, unknown> = {
    chainId,
    blockExplorerUrl: firstValidBlockExplorerUrl,
    chainName,
    rpcUrl: firstValidRPCUrl,
    ticker,
    isNetworkRpcUpdate: !!existingNetworkConfiguration,
  };

  const alerts = await checkSafeNetwork(
    getDecimalChainId(chainId as string),
    requestData.rpcUrl as string,
    requestData.chainName as string,
    requestData.ticker as string,
  );
  requestData.alerts = alerts;

  MetaMetrics.getInstance().trackEvent(
    MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_REQUESTED)
      .addProperties({
        chain_id: getDecimalChainId(chainId as string),
        source: 'Custom Network API',
        symbol: ticker,
        ...analytics,
      })
      .build(),
  );

  // Remove all existing approvals, including other add network requests.
  ApprovalController.clear(providerErrors.userRejectedRequest());

  // If existing approval request was an add network request, wait for
  // it to be rejected and for the corresponding approval flow to be ended.
  await waitForInteraction();

  try {
    await requestUserApproval({
      type: 'ADD_ETHEREUM_CHAIN',
      requestData,
    });
  } catch (error) {
    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(
        MetaMetricsEvents.NETWORK_REQUEST_REJECTED,
      )
        .addProperties({
          chain_id: getDecimalChainId(chainId as string),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );
    throw providerErrors.userRejectedRequest();
  }

  let newNetworkConfiguration: Record<string, unknown> | undefined;
  if (existingNetworkConfiguration) {
    const currentChainId = selectEvmChainId(store.getState());

    const rpcResult = addOrUpdateIndex(
      existingNetworkConfiguration.rpcEndpoints,
      {
        url: firstValidRPCUrl,
        type: RpcEndpointType.Custom,
        name: chainName,
      } as (typeof existingNetworkConfiguration.rpcEndpoints)[number],
      (endpoint) => endpoint.url === firstValidRPCUrl,
    );

    const blockExplorerResult = addOrUpdateIndex(
      existingNetworkConfiguration.blockExplorerUrls,
      firstValidBlockExplorerUrl as string,
      (url) => url === firstValidBlockExplorerUrl,
    );

    const updatedNetworkConfiguration = {
      ...existingNetworkConfiguration,
      rpcEndpoints: rpcResult.updatedArray,
      defaultRpcEndpointIndex: rpcResult.index,
      blockExplorerUrls: blockExplorerResult.updatedArray,
      defaultBlockExplorerUrlIndex: blockExplorerResult.index,
    };

    newNetworkConfiguration = await NetworkController.updateNetwork(
      chainId as `0x${string}`,
      updatedNetworkConfiguration,
      currentChainId === chainId
        ? {
            replacementSelectedRpcEndpointIndex:
              updatedNetworkConfiguration.defaultRpcEndpointIndex,
          }
        : undefined,
    );
  } else {
    newNetworkConfiguration = NetworkController.addNetwork({
      chainId: chainId as `0x${string}`,
      blockExplorerUrls: [firstValidBlockExplorerUrl as string],
      defaultRpcEndpointIndex: 0,
      defaultBlockExplorerUrlIndex: 0,
      name: chainName,
      nativeCurrency: ticker,
      rpcEndpoints: [
        {
          url: firstValidRPCUrl,
          name: chainName,
          type: RpcEndpointType.Custom,
        },
      ],
    });

    MetaMetrics.getInstance().trackEvent(
      MetricsEventBuilder.createEventBuilder(MetaMetricsEvents.NETWORK_ADDED)
        .addProperties({
          chain_id: getDecimalChainId(chainId as string),
          source: 'Custom Network API',
          symbol: ticker,
          ...analytics,
        })
        .build(),
    );

    MetaMetrics.getInstance().addTraitsToUser(addItemToChainIdList(chainId as string));
  }
  switchToNetworkAndMetrics(newNetworkConfiguration as Record<string, unknown>);

  res.result = null;
};
