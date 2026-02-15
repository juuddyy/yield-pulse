"use client";

import { usePoolDiscovery } from "@/hooks/usePoolDiscovery";
import { useAccount } from "wagmi";

export function PoolDiscoveryDebug() {
  const { isConnected } = useAccount();
  const { pools, poolCount, isLoading, hasVoter } = usePoolDiscovery();

  if (!isConnected) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Connect wallet to discover pools</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto">
      <h3 className="text-lg font-bold mb-4 text-green-400">🔍 Dynamic Pool Discovery</h3>
      
      <div className="mb-4 space-y-1">
        <p>Voter Contract Active: <span className={hasVoter ? "text-green-400" : "text-red-400"}>{hasVoter ? "Yes" : "No"}</span></p>
        <p>Total Pools Found: <span className="text-blue-400">{poolCount}</span></p>
        <p>Your Pools with Balance: <span className="text-yellow-400">{pools.length}</span></p>
      </div>

      {isLoading && <p className="text-blue-400 mb-4">Loading pools...</p>}

      {pools.length === 0 && !isLoading && (
        <p className="text-gray-400">No pools with balance found for your wallet</p>
      )}

      <div className="space-y-4">
        {pools.map((pool, idx) => (
          <div key={idx} className="border border-gray-700 p-3 rounded">
            <p className="text-yellow-300 font-bold">{pool.name}</p>
            <p className="text-gray-500 text-xs break-all">Pool: {pool.address}</p>
            {pool.gaugeAddress && (
              <p className="text-gray-500 text-xs break-all">Gauge: {pool.gaugeAddress}</p>
            )}
            
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-400">LP in Wallet:</p>
                <p className="text-green-400">{pool.userLpBalance.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400">LP Staked (Gauge):</p>
                <p className="text-purple-400">{pool.userStakedBalance.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400">Total LP:</p>
                <p className="text-blue-400">{pool.totalLpBalance.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-gray-400">Pending Rewards:</p>
                <p className="text-orange-400">{pool.pendingRewards.toFixed(6)}</p>
              </div>
            </div>

            {pool.reserves && (
              <div className="mt-2 text-xs">
                <p className="text-gray-400">
                  Reserves: {pool.reserves.reserve0.toFixed(4)} / {pool.reserves.reserve1.toFixed(4)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-gray-800 rounded text-xs">
        <p className="text-gray-400">
          This dynamically discovers ALL pools from the Voter contract.
          No manual updates needed when new pools are added!
        </p>
      </div>
    </div>
  );
}
