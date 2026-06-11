"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TBody, THead, Td, Th, Tr } from "@/components/ui/table";
import type { ProfileRow } from "@/types/database";

export function UsersTable({
  users,
  currentUserId,
}: {
  users: ProfileRow[];
  currentUserId: string;
}) {
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Display name</Th>
          <Th>Points</Th>
          <Th>Joined</Th>
          <Th>Role</Th>
          <Th className="text-right">Action</Th>
        </Tr>
      </THead>
      <TBody>
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </TBody>
    </Table>
  );
}

function UserRow({ user, isSelf }: { user: ProfileRow; isSelf: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function toggleAdmin() {
    setPending(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isAdmin: !user.is_admin }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        alert(body.error ?? "Failed");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Tr>
      <Td className="font-medium">{user.display_name}</Td>
      <Td className="tabular-nums">{user.total_points}</Td>
      <Td className="text-sm text-muted-foreground">
        {new Date(user.created_at).toLocaleDateString()}
      </Td>
      <Td>
        {user.is_admin ? <Badge>Admin</Badge> : <Badge variant="outline">User</Badge>}
      </Td>
      <Td className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={toggleAdmin}
          disabled={isSelf || pending}
          title={isSelf ? "You can't change your own role" : ""}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {user.is_admin ? "Demote" : "Promote"}
        </Button>
      </Td>
    </Tr>
  );
}
