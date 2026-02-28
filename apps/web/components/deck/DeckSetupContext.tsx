import { createContext, useContext, useState } from 'react';
import type { Dispatch, SetStateAction, ReactNode } from 'react';
import type { CardColor } from '@gundam-forge/shared';

export type DeckVisibility = 'private' | 'unlisted' | 'public';

type DeckSetupContextType = {
  name: string;
  visibility: DeckVisibility;
  archetype: string;
  description: string;
  colors: CardColor[];
  decklist: string;
  setId: string;
  setName: Dispatch<SetStateAction<string>>;
  setVisibility: Dispatch<SetStateAction<DeckVisibility>>;
  setArchetype: Dispatch<SetStateAction<string>>;
  setDescription: Dispatch<SetStateAction<string>>;
  setColors: Dispatch<SetStateAction<CardColor[]>>;
  setDecklist: Dispatch<SetStateAction<string>>;
  setSetId: Dispatch<SetStateAction<string>>;
};

const defaultContext: DeckSetupContextType = {
  name: '',
  visibility: 'private',
  archetype: '',
  description: '',
  colors: [],
  decklist: '',
  setId: '',
  setName: () => {},
  setVisibility: () => {},
  setArchetype: () => {},
  setDescription: () => {},
  setColors: () => {},
  setDecklist: () => {},
  setSetId: () => {},
};

export const DeckSetupContext = createContext<DeckSetupContextType>(defaultContext);

export function DeckSetupProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<DeckVisibility>('private');
  const [archetype, setArchetype] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<CardColor[]>([]);
  const [decklist, setDecklist] = useState('');
  const [setId, setSetId] = useState('');

  return (
    <DeckSetupContext.Provider
      value={{
        name, setName,
        visibility, setVisibility,
        archetype, setArchetype,
        description, setDescription,
        colors, setColors,
        decklist, setDecklist,
        setId, setSetId,
      }}
    >
      {children}
    </DeckSetupContext.Provider>
  );
}

export function useDeckSetupContext() {
  return useContext(DeckSetupContext);
}
