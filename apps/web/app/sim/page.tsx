import { redirect } from 'next/navigation';

// /sim is a deprecated route — forward users to the Forge deck builder
export default function SimPage(): never {
  redirect('/forge');
}
