import Engine from '../Engine';
import { providerErrors, rpcErrors } from '@metamask/rpc-errors';
import { selectEvmNetworkConfigurationsByChainId } from '../../selectors/networkController';
import { store } from '../../store';
import {
  validateChainId,
  findExistingNetwork,
  switchToNetwork,
} from './lib/ethereum-chain-utils';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { isSnapId } from '@metamask/snaps-utils';

/**
 * Switch chain implementation to be used in JsonRpcEngine middleware.
 *
 * @param params.req - The JsonRpcEngine request.
 * @param params.res - The JsonRpcEngine result object.
 * @param params.requestUserApproval - The callback to trigger user approval flow.
 * @param params.analytics - Analytics parameters to be passed when tracking event via `MetaMetrics`.
 * @param params.hooks - Method hooks passed to the method implementation.
 * @returns {void}.
 */
interface WalletSwitchEthereumChainParams {
  req: { params: unknown[] | null; origin: string };
  res: { result: unknown };
  requestUserApproval: (args: { type: string; requestData: Record<string, unknown> }) => Promise<void>;
  analytics: Record<string, unknown>;
  hooks: {
    getCurrentChainIdForDomain: (origin: string) => string;
    getNetworkConfigurationByChainId: (chainId: string) => Record<string, unknown> | undefined;
    getCaveat: (...args: unknown[]) => unknown;
    requestPermittedChainsPermissionIncrementalForOrigin: (args: Record<string, unknown>) => Promise<void>;
    hasApprovalRequestsForOrigin: (...args: unknown[]) => boolean;
    setTokenNetworkFilter: (...args: unknown[]) => void;
    rejectApprovalRequestsForOrigin: (...args: unknown[]) => void;
  };
}

export const wallet_switchEthereumChain = async ({
  req,
  res,
  requestUserApproval,
  analytics,
  hooks,
}: WalletSwitchEthereumChainParams): Promise<void> => {
  const {
    CurrencyRateController,
    NetworkController,
    MultichainNetworkController,
    SelectedNetworkController,
  } = Engine.context;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const params = (req.params as any)?.[0];
  const { origin } = req;
  if (!params || typeof params !== 'object') {
    throw rpcErrors.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId } = params;
  const allowedKeys = {
    chainId: true,
  };

  const extraKeys = Object.keys(params).filter((key) => !allowedKeys[key as keyof typeof allowedKeys]);
  if (extraKeys.length) {
    throw rpcErrors.invalidParams(
      `Received unexpected keys on object parameter. Unsupported keys:\n${extraKeys}`,
    );
  }
  const _chainId = validateChainId(chainId);
  // TODO: [SOLANA] - This do not support non evm networks
  const networkConfigurations = selectEvmNetworkConfigurationsByChainId(
    store.getState(),
  );
  const existingNetwork = findExistingNetwork(_chainId, networkConfigurations);
  if (existingNetwork) {
    const currentDomainSelectedNetworkClientId =
      SelectedNetworkController.getNetworkClientIdForDomain(origin);
    const {
      configuration: { chainId: currentDomainSelectedChainId },
    } = NetworkController.getNetworkClientById(
      currentDomainSelectedNetworkClientId,
    ) || { configuration: {} };

    if (currentDomainSelectedChainId === _chainId) {
      res.result = null;
      return;
    }

    const currentChainIdForOrigin = hooks.getCurrentChainIdForDomain(origin);

    const fromNetworkConfiguration = hooks.getNetworkConfigurationByChainId(
      currentChainIdForOrigin,
    );

    const toNetworkConfiguration =
      hooks.getNetworkConfigurationByChainId(chainId);

    await switchToNetwork({
      network: existingNetwork,
      chainId: _chainId,
      requestUserApproval,
      analytics,
      origin,
      autoApprove: isSnapId(origin),
      hooks: {
        toNetworkConfiguration,
        fromNetworkConfiguration,
        ...hooks,
      },
    });

    res.result = null;
    return;
  }

  throw providerErrors.custom({
    code: 4902, // To-be-standardized "unrecognized chain ID" error
    message: `Unrecognized chain ID "${_chainId}". Try adding the chain using wallet_addEthereumChain first.`,
  });
};

export const switchEthereumChainHandler = {
  methodNames: [MESSAGE_TYPE.SWITCH_ETHEREUM_CHAIN],
  implementation: wallet_switchEthereumChain,
  hookNames: {
    getNetworkConfigurationByChainId: true,
    setActiveNetwork: true,
    requestUserApproval: true,
    getCaveat: true,
    getCurrentChainIdForDomain: true,
    requestPermittedChainsPermissionIncrementalForOrigin: true,
    setTokenNetworkFilter: true,
    hasApprovalRequestsForOrigin: true,
    rejectApprovalRequestsForOrigin: true,
  },
} as const;
