import { Container } from '@/components/layout/Container';
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
    <Container className="py-3 lg:py-4" wide>
      <ForgeWorkbench cards={forgeCards} />
    </Container>
  );
}
