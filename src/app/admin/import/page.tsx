import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportForm } from "./import-form";

export const metadata = { title: "Admin · Import" };

export default function AdminImportPage() {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Import fixtures from ICS</CardTitle>
        <CardDescription>
          Upload a FotMob (or compatible) <code>.ics</code> calendar. Matches are upserted by
          their UID so re-importing is safe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImportForm />
      </CardContent>
    </Card>
  );
}
