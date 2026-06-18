import { create } from 'zustand';
import Inquiry from '../model/inquiry/Inquiry';
import Offer from '../model/offer/Offer';
import Order from '../model/order/Order';
import OrderOffer from '../model/orderOffer/OrderOffer';
import User from '../model/user/User';

export interface Store {
  // the current authenticated user, seeded from the server (getAuthContext) so
  // client components can branch on role without a separate React context.
  authContext: { userId: string; roles: string[] } | null;
  entities: {
    inquiry: { [id: string]: Inquiry };
    offer: { [id: string]: Offer };
    order: { [id: string]: Order };
    orderOffer: { [id: string]: OrderOffer };
    user: { [id: string]: User };
  };
}

export const initialState: Store = {
  authContext: null,
  entities: {
    inquiry: {},
    offer: {},
    order: {},
    orderOffer: {},
    user: {},
  },
};

export const useStore = create<Store>(() => initialState);
export const setStore = useStore.setState;
