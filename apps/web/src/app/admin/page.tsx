"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt: string | number | Date;
};

export default function AdminPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (isPending === false && session === null) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });
      if (res.data) {
        setUsers(res.data.users as unknown as User[]);
      }
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session || session.user.role !== "admin") {
    return (
      <div className="container mx-auto py-10">
        <h1 className="mb-5 font-bold text-2xl">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <p>Current Role: {session?.user?.role || "None"}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-5 font-bold text-2xl">Admin Dashboard</h1>
      <div className="mb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-xl">Users</h2>
          <Button disabled={loadingUsers} onClick={fetchUsers}>
            Refresh
          </Button>
        </div>
        {loadingUsers ? (
          <div>Loading users...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
