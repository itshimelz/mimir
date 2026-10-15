// FILE: Navbar.tsx
// Purpose: Server wrapper that resolves GitHub stars, then renders the M3E app bar.
import { getStars } from "@/lib/githubStars";
import AppBarChrome from "@/components/AppBarChrome";

export default async function Navbar() {
  const stars = await getStars();
  return <AppBarChrome stars={stars} />;
}
