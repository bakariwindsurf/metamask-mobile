import { rpcErrors } from '@metamask/rpc-errors';
import { MESSAGE_TYPE } from '../createTracingMiddleware';
import { trackDappViewedEvent } from '../../util/metrics';
import { isSnapId } from '@metamask/snaps-utils';

interface EthRequestAccountsHooks {
  getAccounts: (opts: { ignoreLock: boolean }) => string[];
  getUnlockPromise: (shouldShowUnlockRequest: boolean) => Promise<void>;
  getCaip25PermissionFromLegacyPermissionsForOrigin: () => unknown;
  requestPermissionsForOrigin: (permission: unknown) => Promise<void>;
}

interface JsonRpcRequest {
  origin: string;
  [key: string]: unknown;
}

interface JsonRpcResponse {
  result?: unknown;
  error?: ReturnType<typeof rpcErrors.resourceUnavailable>;
}

const requestEthereumAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS],
  implementation: requestEthereumAccountsHandler,
  hookNames: {
    getAccounts: true,
    getUnlockPromise: true,
    getCaip25PermissionFromLegacyPermissionsForOrigin: true,
    requestPermissionsForOrigin: true,
  },
} as const;
export default requestEthereumAccounts;

// Used to rate-limit pending requests to one per origin
const locks = new Set<string>();

async function requestEthereumAccountsHandler(
  req: JsonRpcRequest,
  res: JsonRpcResponse,
  _next: () => void,
  end: (error?: unknown) => void,
  {
    getAccounts,
    getUnlockPromise,
    getCaip25PermissionFromLegacyPermissionsForOrigin,
    requestPermissionsForOrigin,
  }: EthRequestAccountsHooks,
): Promise<void> {
  const { origin } = req;
  if (locks.has(origin)) {
    res.error = rpcErrors.resourceUnavailable(
      `Already processing ${MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS}. Please wait.`,
    );
    return end();
  }

  let ethAccounts = getAccounts({ ignoreLock: true });
  if (ethAccounts.length > 0) {
    // We wait for the extension to unlock in this case only, because permission
    // requests are handled when the extension is unlocked, regardless of the
    // lock state when they were received.
    try {
      locks.add(origin);
      await getUnlockPromise(true);
      res.result = ethAccounts;
      end();
    } catch (error) {
      end(error);
    } finally {
      locks.delete(origin);
    }
    return undefined;
  }

  try {
    const caip25Permission =
      getCaip25PermissionFromLegacyPermissionsForOrigin();
    await requestPermissionsForOrigin(caip25Permission);
  } catch (error) {
    return end(error);
  }

  // We cannot derive ethAccounts directly from the CAIP-25 permission
  // because the accounts will not be in order of lastSelected
  ethAccounts = getAccounts({ ignoreLock: true });

  if (!isSnapId(origin)) {
    // Origin is actually a hostname here, this should change in the future.
    trackDappViewedEvent({
      hostname: origin,
      numberOfConnectedAccounts: ethAccounts.length,
    });
  }

  res.result = ethAccounts;
  return end();
}
