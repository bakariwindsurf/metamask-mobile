import React from 'react';

// Mock stream manager
const mockStreamManager = {
  prices: {
    subscribeToSymbols: jest.fn(() => jest.fn()),
    subscribe: jest.fn(() => jest.fn()),
  },
  orders: {
    subscribe: jest.fn(() => jest.fn()),
  },
  positions: {
    subscribe: jest.fn(() => jest.fn()),
  },
  fills: {
    subscribe: jest.fn(() => jest.fn()),
  },
};

// Mock provider component
interface PerpsStreamProviderProps {
  children: React.ReactNode;
  }: {?: unknown;
  children: React.ReactNode;?: unknown;
}

export const PerpsStreamProvider = ({
  children,
}: {
  children: React.ReactNode;
}: PerpsStreamProviderProps) => <>{children}</>;

// Mock hook
export const usePerpsStream = jest.fn(() => mockStreamManager);

// Export the mock stream manager for test access
export const getStreamManagerInstance = () => mockStreamManager;
