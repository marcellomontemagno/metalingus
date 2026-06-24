import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import getAuthContext from "@/lib/auth/getAuthContext";
import { auth } from "@/lib/auth";
import { sql } from "@/lib/db/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// The user's current Business (first membership) plus their role in it.
async function currentMembership(userId: string) {
  const rows = await sql`
    SELECT o.id, o.name, m.role FROM member m JOIN organization o ON o.id = m."organizationId"
    WHERE m."userId" = ${userId} ORDER BY o.name LIMIT 1`;
  return rows[0] as { id: string; name: string; role: string } | undefined;
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const { user } = await getAuthContext();
  const org = await currentMembership(user.id);

  if (!org) {
    return (
      <main className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">You're not part of a Business yet.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const canManage = org.role === "owner" || org.role === "admin";

  const members = await sql`
    SELECT u.email, u.name, m.role FROM member m JOIN "user" u ON u.id = m."userId"
    WHERE m."organizationId" = ${org.id} ORDER BY (m.role = 'owner') DESC, u.email`;
  const invites = await sql`
    SELECT email, role, "expiresAt" FROM invitation
    WHERE "organizationId" = ${org.id} AND status = 'pending' ORDER BY "createdAt" DESC`;

  async function invite(formData: FormData) {
    "use server";
    const { user } = await getAuthContext();
    const acting = await currentMembership(user.id);
    if (!acting || (acting.role !== "owner" && acting.role !== "admin")) {
      throw new Error("Forbidden");
    }
    const email = String(formData.get("email") ?? "").trim();
    const role = String(formData.get("role") ?? "member");
    if (!email) redirect("/members?error=" + encodeURIComponent("Email is required"));
    try {
      await auth.api.createInvitation({
        body: { email, role: role as "member" | "admin", organizationId: acting.id },
        headers: await headers(),
      });
    } catch (e) {
      redirect("/members?error=" + encodeURIComponent(e instanceof Error ? e.message : "Invite failed"));
    }
    revalidatePath("/members");
    redirect("/members?invited=" + encodeURIComponent(email));
  }

  return (
    <main className="space-y-6 p-6">
      {(sp.invited || sp.error) && (
        <div className="text-sm">
          {sp.invited && <p className="text-green-600">Invitation sent to {sp.invited}.</p>}
          {sp.error && <p className="text-destructive">{sp.error}</p>}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{org.name} — Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.email}>
                  <TableCell data-label="Email">{m.email}</TableCell>
                  <TableCell data-label="Name" className="text-muted-foreground">
                    {m.name ?? "—"}
                  </TableCell>
                  <TableCell data-label="Role">
                    <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Invite a colleague</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={invite} className="max-w-md">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="inv-email">Email</FieldLabel>
                  <Input id="inv-email" name="email" type="email" placeholder="colleague@business.com" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="inv-role">Role</FieldLabel>
                  <select
                    id="inv-role"
                    name="role"
                    defaultValue="member"
                    className="border-input dark:bg-input/30 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </Field>
                <Button type="submit" className="w-fit">
                  Send invitation
                </Button>
              </FieldGroup>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              The invitee needs an account already (allowlisted). They'll get an email to accept.
            </p>
          </CardContent>
        </Card>
      )}

      {invites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((i) => (
                  <TableRow key={i.email}>
                    <TableCell data-label="Email">{i.email}</TableCell>
                    <TableCell data-label="Role">{i.role}</TableCell>
                    <TableCell data-label="Expires" className="text-muted-foreground">
                      {new Date(i.expiresAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
