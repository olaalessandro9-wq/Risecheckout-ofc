/**
 * Users Actors - Data Fetching for Users Region
 * 
 * RISE Protocol V3 - XState Actors
 * 
 * @version 1.0.0
 */

import { fromPromise } from "xstate";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";
import type { LoadUsersInput, LoadUsersOutput, ChangeRoleInput } from "../adminMachine.types";
import type { UserWithRole } from "../../types/admin.types";

const log = createLogger("AdminUsersActors");

// ============================================================================
// LOAD USERS ACTOR
// ============================================================================

export const loadUsersActor = fromPromise<LoadUsersOutput, LoadUsersInput>(
  async ({ input }) => {
    log.info("Loading admin users", { callerRole: input.callerRole });

    const [usersRes, emailsRes] = await Promise.all([
      api.call<{ users: UserWithRole[] }>("admin-data", { 
        action: "users-with-metrics" 
      }),
      input.callerRole === "owner"
        ? api.call<{ emails: Record<string, string> }>("get-users-with-emails", {})
        : Promise.resolve({ data: { emails: {} }, error: null }),
    ]);

    if (usersRes.error) {
      log.error("Failed to load users", { error: usersRes.error.message });
      throw new Error(usersRes.error.message || "Erro ao carregar usuários");
    }

    const users = usersRes.data?.users ?? [];
    const emails = emailsRes.data?.emails ?? {};

    // Merge emails into users
    const usersWithEmails = users.map(user => ({
      ...user,
      email: emails[user.user_id] || user.email,
    }));

    log.info("Users loaded successfully", { count: usersWithEmails.length });

    return {
      users: usersWithEmails,
      emails,
    };
  }
);

// ============================================================================
// CHANGE ROLE ACTOR
// ============================================================================

export const changeRoleActor = fromPromise<void, ChangeRoleInput>(
  async ({ input }) => {
    log.info("Changing user role", { userId: input.userId, newRole: input.newRole });

    const { data, error } = await api.call<{ success: boolean; error?: string }>(
      "manage-user-role",
      {
        targetUserId: input.userId,
        newRole: input.newRole,
      }
    );

    if (error) {
      log.error("Failed to change role", { error: error.message });
      throw new Error(error.message || "Erro ao alterar role");
    }

    if (data?.error) {
      log.error("Role change returned error", { error: data.error });
      throw new Error(data.error);
    }

    log.info("Role changed successfully", { userId: input.userId, newRole: input.newRole });
  }
);
