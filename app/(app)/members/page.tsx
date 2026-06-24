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

// Guard for the management actions — owner/admin of their current Business only.
async function assertManager(userId: string) {
  const acting = await currentMembership(userId);
  if (!acting || (acting.role !== "owner" && acting.role !== "admin")) {
    throw new Error("Forbidden");
  }
  return acting;
}

const SELECT_CLASS =
  "border-input dark:bg-input/30 h-8 rounded-md border bg-transparent px-2 text-xs";

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{
    invited?: string;
    updated?: string;
    removed?: string;
    error?: string;
  }>;
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
    SELECT u.email, u.name, m.role, m.id AS member_id, m."userId"
    FROM member m JOIN "user" u ON u.id = m."userId"
    WHERE m."organizationId" = ${org.id} ORDER BY (m.role = 'owner') DESC, u.email`;
  const invites = await sql`
    SELECT email, role, "expiresAt" FROM invitation
    WHERE "organizationId" = ${org.id} AND status = 'pending' ORDER BY "createdAt" DESC`;

  async function invite(formData: FormData) {
    "use server";
    const { user } = await getAuthContext();
    const acting = await assertManager(user.id);
    const email = String(formData.get("email") ?? "").trim();
    const role = String(formData.get("role") ?? "member");
    if (!email) redirect("/members?error=" + encodeURIComponent("Email is required"));
    try {
      await auth.api.createInvitation({
        body: { email, role: role as "member" | "admin", organizationId: acting.id },
        headers: await headers(),
      });
      // Deliver the invite as a one-click magic link that signs the invitee in
      // and lands them on the accept page (sendInvitationEmail is intentionally
      // not configured). Best-effort: a not-yet-allowlisted email can't sign in.
      const inv = await sql`
        SELECT id FROM invitation WHERE "organizationId" = ${acting.id}
        AND email = ${email} AND status = 'pending' ORDER BY "createdAt" DESC LIMIT 1`;
      if (inv[0]?.id) {
        await auth.api
          .signInMagicLink({
            body: { email, callbackURL: `/accept-invite?id=${inv[0].id}` },
            headers: await headers(),
          })
          .catch(() => {});
      }
    } catch (e) {
      redirect("/members?error=" + encodeURIComponent(e instanceof Error ? e.message : "Invite failed"));
    }
    revalidatePath("/members");
    redirect("/members?invited=" + encodeURIComponent(email));
  }

  async function changeRole(formData: FormData) {
    "use server";
    const { user } = await getAuthContext();
    const acting = await assertManager(user.id);
    const memberId = String(formData.get("memberId") ?? "");
    const role = String(formData.get("role") ?? "");
    if (!memberId || !["member", "admin", "owner"].includes(role)) {
      redirect("/members?error=" + encodeURIComponent("Invalid role change"));
    }
    try {
      await auth.api.updateMemberRole({
        body: { memberId, role: role as "member" | "admin" | "owner", organizationId: acting.id },
        headers: await headers(),
      });
    } catch (e) {
      redirect("/members?error=" + encodeURIComponent(e instanceof Error ? e.message : "Couldn't change role"));
    }
    revalidatePath("/members");
    redirect("/members?updated=1");
  }

  async function removeMember(formData: FormData) {
    "use server";
    const { user } = await getAuthContext();
    const acting = await assertManager(user.id);
    const memberId = String(formData.get("memberId") ?? "");
    if (!memberId) redirect("/members?error=" + encodeURIComponent("No member specified"));
    try {
      await auth.api.removeMember({
        body: { memberIdOrEmail: memberId, organizationId: acting.id },
        headers: await headers(),
      });
    } catch (e) {
      redirect("/members?error=" + encodeURIComponent(e instanceof Error ? e.message : "Couldn't remove member"));
    }
    revalidatePath("/members");
    redirect("/members?removed=1");
  }

  return (
    <main className="space-y-6 p-6">
      {(sp.invited || sp.updated || sp.removed || sp.error) && (
        <div className="text-sm">
          {sp.invited && <p className="text-green-600">Invitation sent to {sp.invited}.</p>}
          {sp.updated && <p className="text-green-600">Member role updated.</p>}
          {sp.removed && <p className="text-green-600">Member removed.</p>}
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
                {canManage && <TableHead className="text-right">Manage</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m.member_id}>
                  <TableCell data-label="Email">{m.email}</TableCell>
                  <TableCell data-label="Name" className="text-muted-foreground">
                    {m.name ?? "—"}
                  </TableCell>
                  <TableCell data-label="Role">
                    <Badge variant={m.role === "owner" ? "default" : "secondary"}>{m.role}</Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell data-label="Manage" className="text-right">
                      {m.userId === user.id ? (
                        <span className="text-xs text-muted-foreground">you</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <form action={changeRole} className="flex items-center gap-1">
                            <input type="hidden" name="memberId" value={m.member_id} />
                            <select name="role" defaultValue={m.role} className={SELECT_CLASS}>
                              <option value="member">member</option>
                              <option value="admin">admin</option>
                              <option value="owner">owner</option>
                            </select>
                            <Button type="submit" size="sm" variant="outline">
                              Update
                            </Button>
                          </form>
                          <form action={removeMember}>
                            <input type="hidden" name="memberId" value={m.member_id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Remove
                            </Button>
                          </form>
                        </div>
                      )}
                    </TableCell>
                  )}
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
