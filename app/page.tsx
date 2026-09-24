import { BrowserShell } from "@/components/browser/BrowserShell";
import { PersonProvider } from "@/lib/context/PersonContext";
import { PersonService } from "@/lib/services/personService";

export default async function Home() {
  const people = await PersonService.list();

  return (
    <PersonProvider people={people}>
      <BrowserShell />
    </PersonProvider>
  );
}
