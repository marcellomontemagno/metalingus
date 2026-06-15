import { create } from 'zustand';
import { produce } from 'immer';
import Inquiry from '../model/inquiry/Inquiry';
import Offer from '../model/offer/Offer';
import User from '../model/user/User';

export interface Store {
  entities: {
    inquiry: { [id: string]: Inquiry };
    offer: { [id: string]: Offer };
    user: { [id: string]: User };
  };
}

export const initialState: Store = {
  entities: {
    inquiry: {},
    offer: {},
    user: {},
  },
};

export const useStore = create<Store>(() => initialState);
export const setStore = useStore.setState;
