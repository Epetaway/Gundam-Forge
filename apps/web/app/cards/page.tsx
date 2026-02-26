import CardsClient from './CardsClient';
import { cards } from '@/lib/data/cards';

export default function CardsPage(): JSX.Element {
  return <CardsClient initialCards={cards} />;
}
