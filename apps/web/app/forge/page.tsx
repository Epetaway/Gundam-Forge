import { Container } from '@/components/layout/Container';
import { PageHeader } from '@/components/layout/PageHeader';
import { cards } from '@/lib/data/cards';
import { ForgeWorkbench, type ForgeCard } from '@/app/forge/forge-workbench';

export default function ForgePage(): JSX.Element {
  const forgeCards: ForgeCard[] = cards.map((card) => ({
    id: card.id,
    name: card.name,
    color: card.color,
    type: card.type,
    cost: card.cost,
    set: card.set,
    text: card.text,
    imageUrl: card.imageUrl,
  }));

  return (
    <Container className="space-y-6 py-8">
      <PageHeader
        description="Build and validate decks with an SSR-delivered card catalog and lightweight client-side interactions."
        eyebrow="Deck Lab"
        title="Forge Workspace"
      />
      <ForgeWorkbench cards={forgeCards} />
    </Container>
  );
}
