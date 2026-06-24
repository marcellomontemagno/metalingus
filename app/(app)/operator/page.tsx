import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import getAuthContext from "@/lib/auth/getAuthContext";
import { provisionBusiness } from "@/lib/provisionBusiness";
import { sql } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function OperatorPage({
  searchParams,
}: {
  searchParams: Promise<{ provisioned?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const businesses = await sql`
    SELECT o.name, o.slug,
      (SELECT u.email FROM member m JOIN "user" u ON u.id = m."userId"
       WHERE m."organizationId" = o.id AND m.role = 'owner' LIMIT 1) AS owner,
      (SELECT count(*)::int FROM member m WHERE m."organizationId" = o.id) AS members
    FROM organization o ORDER BY o.name`;

  async function provision(formData: FormData) {
    "use server";
    const { roles } = await getAuthContext();
    if (!roles.some((r) => r.name === "broker")) throw new Error("Forbidden");

    const email = String(formData.get("email") ?? "").trim();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const type = String(formData.get("type") ?? "");
    if (!email || !businessName || !["buyer", "seller", "both"].includes(type)) {
      redirect("/operator?error=" + encodeURIComponent("Missing or invalid fields"));
    }
    try {
      await provisionBusiness({
        email,
        businessName,
        type: type as "buyer" | "seller" | "both",
      });
    } catch (e) {
      redirect(
        "/operator?error=" +
          encodeURIComponent(e instanceof Error ? e.message : "Provisioning failed"),
      );
    }
    revalidatePath("/operator");
    redirect("/operator?provisioned=" + encodeURIComponent(businessName));
  }

  return (
    <main className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Provision a Business</CardTitle>
        </CardHeader>
        <CardContent>
          {sp.provisioned && (
            <p className="mb-3 text-sm text-green-600">
              Provisioned “{sp.provisioned}”. The owner can now sign in.
            </p>
          )}
          {sp.error && <p className="mb-3 text-sm text-destructive">{sp.error}</p>}
          <form action={provision} className="max-w-md">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Owner email</FieldLabel>
                <Input id="email" name="email" type="email" placeholder="owner@business.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="businessName">Business name</FieldLabel>
                <Input id="businessName" name="businessName" placeholder="Acme Steel" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="type">Type</FieldLabel>
                <select
                  id="type"
                  name="type"
                  defaultValue="buyer"
                  className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="both">Both</option>
                </select>
              </Field>
              <Button type="submit" className="w-fit">
                Provision business
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Businesses</CardTitle>
        </CardHeader>
        <CardContent>
          {businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No businesses yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Members</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((b) => (
                  <TableRow key={b.slug}>
                    <TableCell data-label="Name">{b.name}</TableCell>
                    <TableCell data-label="Owner" className="text-muted-foreground">
                      {b.owner ?? "—"}
                    </TableCell>
                    <TableCell data-label="Members" className="text-right">
                      {b.members}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
