
import React, { createContext, useState, ReactNode, Dispatch, SetStateAction } from 'react';
import type { ListingDraft } from '../types';

type ListingContextType = [ListingDraft, Dispatch<SetStateAction<ListingDraft>>];

export const ListingContext = createContext<ListingContextType | undefined>(undefined);

interface ListingContextProviderProps {
  children: ReactNode;
}

export const ListingContextProvider: React.FC<ListingContextProviderProps> = ({ children }) => {
  const [listingDraft, setListingDraft] = useState<ListingDraft>({});

  return (
    <ListingContext.Provider value={[listingDraft, setListingDraft]}>
      {children}
    </ListingContext.Provider>
  );
};
