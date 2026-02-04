import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to dashboard or login (handled by middleware)
  redirect('/dashboard');
}
