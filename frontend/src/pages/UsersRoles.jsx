import { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import { useAdminBackgroundPoll } from "@/lib/adminPoll";
import { PageHeader } from "@/components/PageHeader";
import { ShieldCheck, User } from "@phosphor-icons/react";

export default function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  const load = useCallback(async () => {
    try {
      const [u, l] = await Promise.all([
        api.get("/users"),
        api.get("/activity-logs?limit=50"),
      ]);
      setUsers(Array.isArray(u.data) ? u.data : []);
      setLogs(Array.isArray(l.data) ? l.data : []);
    } catch {
      /* keep prior data on background refresh */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminBackgroundPoll(() => {
    load();
  }, [load]);

  return (
    <div data-testid="users-page">
      <PageHeader title="Users & Roles" description="Admin accounts, role assignments, and activity logs." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sharp-card overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#E60000]" />
            <div className="font-display font-bold text-base tracking-tight">Admin Users</div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4">Name</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4">Email</th>
                <th className="px-2 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-neutral-600 sm:px-4">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-neutral-100" data-testid={`user-${u.id}`}>
                  <td className="px-2 py-3 text-xs sm:px-4">
                    <span className="inline-flex items-center gap-2"><User size={14} /> {u.name}</span>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs sm:px-4">{u.email}</td>
                  <td className="px-2 py-3 sm:px-4"><span className="text-[10px] font-semibold uppercase tracking-wider text-[#E60000]">{u.role}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="sharp-card overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-200">
            <div className="font-display font-bold text-base tracking-tight">Activity Logs</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-semibold mt-0.5">Latest 50 actions</div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {logs.map(log => (
              <div key={log.id} className="flex flex-col gap-1 border-b border-neutral-100 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:px-5" data-testid={`log-${log.id}`}>
                <div className="min-w-0">
                  <span className="font-semibold capitalize">{log.action.replace(/_/g, " ")}</span>
                  <span className="ml-0 mt-1 block font-mono text-[10px] text-neutral-500 sm:ml-2 sm:mt-0 sm:inline">{log.actor}</span>
                </div>
                <div className="shrink-0 font-mono text-[10px] text-neutral-400">{new Date(log.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
