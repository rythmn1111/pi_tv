import { Launcher } from "@/components/Launcher";
import { Desk } from "@/components/Paper";
import { getServices } from "@/lib/services";

// Re-read config/services.json on every load so edits on the Pi take effect
// with a refresh rather than a rebuild.
export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await getServices();
  return (
    <Desk>
      <Launcher services={services} />
    </Desk>
  );
}
