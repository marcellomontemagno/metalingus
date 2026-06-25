import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import getAuthContext from "@/lib/auth/getAuthContext";
import { access } from "@/lib/auth/access";
import { auth } from "@/lib/auth";
import {
  provisionBusiness,
  provisionOperator,
  type BusinessType,
} from "@/lib/provisioning";
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

async function assertOperator() {
  const ctx = await getAuthContext();
  if (!access(ctx).isOperator) throw new Error("Forbidden");
}

function emailState(requested: boolean, sent: boolean): string {
  return requested ? (sent ? "sent" : "failed") : "none";
}

// One-click welcome: a magic link that signs the provisioned user straight into
// the app. Returns whether it sent (best-effort — bounces on an unverified domain).
async function sendSignInLink(email: string): Promise<boolean> {
  return auth.api
    .signInMagicLink({ body: { email, callbackURL: "/?welcome" }, headers: await headers() })
    .then(() => true)
    .catch(() => false);
}

export default async function OperatorPage({
  searchParams,
}: {
  searchParams: Promise<{ provisioned?: string; email?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const businesses = await sql`
    SELECT o.name, o.slug,
      (SELECT u.email FROM member m JOIN "user" u ON u.id = m."userId"
       WHERE m."organizationId" = o.id AND m.role = 'owner' LIMIT 1) AS owner,
      (SELECT count(*)::int FROM member m WHERE m."organizationId" = o.id) AS members
    FROM organization o ORDER BY o.name`;

  const operators = await sql`
    SELECT u.email, u.name FROM "user" u
    WHERE u."platformRole" = 'operator' ORDER BY u.email`;

  async function provisionBiz(formData: FormData) {
    "use server";
    await assertOperator();
    const email = String(formData.get("email") ?? "").trim();
    const businessName = String(formData.get("businessName") ?? "").trim();
    const type = String(formData.get("type") ?? "");
    const sendEmail = formData.get("sendEmail") === "on";
    if (!email || !businessName || !["buyer", "seller", "both"].includes(type)) {
      redirect("/operator?error=" + encodeURIComponent("Missing or invalid business fields"));
    }
    try {
      await provisionBusiness({ email, businessName, type: type as BusinessType });
    } catch (e) {
      redirect("/operator?error=" + encodeURIComponent(e instanceof Error ? e.message : "Provisioning failed"));
    }
    const emailSent = sendEmail ? await sendSignInLink(email) : false;
    revalidatePath("/operator");
    redirect(
      `/operator?provisioned=${encodeURIComponent(businessName)}&email=${emailState(sendEmail, emailSent)}`,
    );
  }

  async function provisionOp(formData: FormData) {
    "use server";
    await assertOperator();
    const email = String(formData.get("email") ?? "").trim();
    const sendEmail = formData.get("sendEmail") === "on";
    if (!email) {
      redirect("/operator?error=" + encodeURIComponent("Operator email is required"));
    }
    try {
      await provisionOperator({ email });
    } catch (e) {
      redirect("/operator?error=" + encodeURIComponent(e instanceof Error ? e.message : "Provisioning failed"));
    }
    const emailSent = sendEmail ? await sendSignInLink(email) : false;
    revalidatePath("/operator");
    redirect(
      `/operator?provisioned=${encodeURIComponent(email)}&email=${emailState(sendEmail, emailSent)}`,
    );
  }

  return (
    <main className="space-y-6 p-6">
      {(sp.provisioned || sp.error) && (
        <div className="text-sm">
          {sp.provisioned && (
            <p className="text-green-600">
              Provisioned “{sp.provisioned}”.
              {sp.email === "sent" && " A sign-in email was sent."}
              {sp.email === "failed" && " (Couldn't send the email — verify the Resend domain.)"}
            </p>
          )}
          {sp.error && <p className="text-destructive">{sp.error}</p>}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provision a Business</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={provisionBiz}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="biz-email">Owner email</FieldLabel>
                  <Input id="biz-email" name="email" type="email" placeholder="owner@business.com" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="biz-name">Business name</FieldLabel>
                  <Input id="biz-name" name="businessName" placeholder="Acme Steel" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="biz-type">Type</FieldLabel>
                  <select
                    id="biz-type"
                    name="type"
                    defaultValue="buyer"
                    className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="seller">Seller</option>
                    <option value="both">Both</option>
                  </select>
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="sendEmail" className="size-4" />
                  Send sign-in email
                </label>
                <Button type="submit" className="w-fit">
                  Provision business
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provision an Operator</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={provisionOp}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="op-email">Operator email</FieldLabel>
                  <Input id="op-email" name="email" type="email" placeholder="ops@metalingus.com" required />
                </Field>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="sendEmail" className="size-4" />
                  Send sign-in email
                </label>
                <Button type="submit" className="w-fit">
                  Provision operator
                </Button>
              </FieldGroup>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Operators hold the platform (broker) role and have no Business.
            </p>
          </CardContent>
        </Card>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Operators</CardTitle>
        </CardHeader>
        <CardContent>
          {operators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No operators yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((o) => (
                  <TableRow key={o.email}>
                    <TableCell data-label="Email">{o.email}</TableCell>
                    <TableCell data-label="Name" className="text-muted-foreground">
                      {o.name ?? "—"}
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
