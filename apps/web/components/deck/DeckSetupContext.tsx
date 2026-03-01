import { createContext, useContext, useState } from 'react';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import type { CardColor, DeckIntent } from '@gundam-forge/shared';

export type DeckVisibility = 'private' | 'unlisted' | 'public';

type DeckSetupContextType = {
  name: string;
  visibility: DeckVisibility;
  description: string;
  decklist: string;
  setId: string;
  deckIntent: DeckIntent;
  setName: Dispatch<SetStateAction<string>>;
  setVisibility: Dispatch<SetStateAction<DeckVisibility>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setDecklist: Dispatch<SetStateAction<string>>;
  setSetId: Dispatch<SetStateAction<string>>;
  setDeckIntent: Dispatch<SetStateAction<DeckIntent>>;
};

const defaultDeckIntent: DeckIntent = {
  clans: [],
  colors: [],
  packages: [],
  includeEX: false,
};

const defaultContext: DeckSetupContextType = {
  name: '',
  visibility: 'private',
  description: '',
  decklist: '',
  setId: '',
  deckIntent: defaultDeckIntent,
  setName: () => {},
  setVisibility: () => {},
  setDescription: () => {},
  setDecklist: () => {},
  setSetId: () => {},
  setDeckIntent: () => {},
};

export const DeckSetupContext = createContext<DeckSetupContextType>(defaultContext);

export function DeckSetupProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<DeckVisibility>('private');
  const [description, setDescription] = useState('');
  const [decklist, setDecklist] = useState('');
  const [setId, setSetId] = useState('');
  const [deckIntent, setDeckIntent] = useState<DeckIntent>(defaultDeckIntent);

  return (
    <DeckSetupContext.Provider
      value={{
        name, setName,
        visibility, setVisibility,
        description, setDescription,
        decklist, setDecklist,
        setId, setSetId,
        deckIntent, setDeckIntent,
      }}
    >
      {children}
    </DeckSetupContext.Provider>
  );
}

export function useDeckSetupContext() {
  return useContext(DeckSetupContext);
}
