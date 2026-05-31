import { auth, signOut } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();

  return (
    <div>
      <h1>Protected Page</h1>
      <p>Welcome, {session?.user?.email}</p>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit">Sign Out</button>
      </form>
    </div>
  );
}
