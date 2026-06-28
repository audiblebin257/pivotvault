import { create } from 'zustand';

export const usePricingStore = create((set) => ({
  billingPeriod: 'monthly',
  setBillingPeriod: (period) => set({ billingPeriod: period }),
}));
