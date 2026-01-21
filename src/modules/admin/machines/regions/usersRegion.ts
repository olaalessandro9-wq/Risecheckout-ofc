/**
 * Users Region - Parallel State for Admin Users Tab
 * 
 * RISE Protocol V3 - XState Parallel Region
 * 
 * Manages: user listing, selection, role changes, search
 * 
 * @version 1.0.0
 */

import { assign } from "xstate";
import type { AdminMachineContext, UsersEvent, LoadUsersOutput } from "../adminMachine.types";
import type { SelectedUserData, RoleChangeDialog } from "../../types/admin.types";

// ============================================================================
// ACTIONS
// ============================================================================

export const usersActions = {
  assignUsersData: assign(({ context }, params: { output: LoadUsersOutput }) => ({
    users: {
      ...context.users,
      items: params.output.users,
      emailsMap: params.output.emails,
      error: null,
    },
  })),

  assignUsersError: assign(({ context }, params: { error: unknown }) => ({
    users: {
      ...context.users,
      error: params.error instanceof Error ? params.error.message : "Erro ao carregar usuários",
    },
  })),

  assignSelectedUser: assign(({ context }, params: { user: SelectedUserData }) => ({
    users: {
      ...context.users,
      selectedUser: params.user,
    },
  })),

  clearSelectedUser: assign(({ context }) => ({
    users: {
      ...context.users,
      selectedUser: null,
    },
  })),

  assignUsersSearch: assign(({ context }, params: { term: string }) => ({
    users: {
      ...context.users,
      searchTerm: params.term,
    },
  })),

  assignRoleChangeDialog: assign(({ context }, params: { dialog: RoleChangeDialog }) => ({
    users: {
      ...context.users,
      roleChangeDialog: params.dialog,
    },
  })),

  clearRoleChangeDialog: assign(({ context }) => ({
    users: {
      ...context.users,
      roleChangeDialog: null,
    },
  })),
};

// ============================================================================
// REGION STATE
// ============================================================================

export const usersRegion = {
  initial: "idle" as const,
  states: {
    idle: {
      on: {
        LOAD_USERS: { target: "loading" },
      },
    },
    loading: {
      invoke: {
        id: "loadUsers",
        src: "loadUsersActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          callerRole: context.callerRole,
        }),
        onDone: {
          target: "ready",
          actions: {
            type: "assignUsersData",
            params: ({ event }: { event: { output: LoadUsersOutput } }) => ({
              output: event.output,
            }),
          },
        },
        onError: {
          target: "error",
          actions: {
            type: "assignUsersError",
            params: ({ event }: { event: { error: unknown } }) => ({
              error: event.error,
            }),
          },
        },
      },
    },
    ready: {
      on: {
        SELECT_USER: {
          actions: {
            type: "assignSelectedUser",
            params: ({ event }: { event: Extract<UsersEvent, { type: "SELECT_USER" }> }) => ({
              user: event.user,
            }),
          },
        },
        DESELECT_USER: {
          actions: "clearSelectedUser",
        },
        SET_USERS_SEARCH: {
          actions: {
            type: "assignUsersSearch",
            params: ({ event }: { event: Extract<UsersEvent, { type: "SET_USERS_SEARCH" }> }) => ({
              term: event.term,
            }),
          },
        },
        OPEN_ROLE_CHANGE: {
          actions: {
            type: "assignRoleChangeDialog",
            params: ({ event }: { event: Extract<UsersEvent, { type: "OPEN_ROLE_CHANGE" }> }) => ({
              dialog: event.dialog,
            }),
          },
        },
        CONFIRM_ROLE_CHANGE: { target: "changingRole" },
        CANCEL_ROLE_CHANGE: {
          actions: "clearRoleChangeDialog",
        },
        REFRESH_USERS: { target: "loading" },
      },
    },
    changingRole: {
      invoke: {
        id: "changeRole",
        src: "changeRoleActor",
        input: ({ context }: { context: AdminMachineContext }) => ({
          userId: context.users.roleChangeDialog?.userId ?? "",
          newRole: context.users.roleChangeDialog?.newRole ?? "user",
        }),
        onDone: {
          target: "loading",
          actions: "clearRoleChangeDialog",
        },
        onError: {
          target: "ready",
          actions: [
            {
              type: "assignUsersError",
              params: ({ event }: { event: { error: unknown } }) => ({
                error: event.error,
              }),
            },
            "clearRoleChangeDialog",
          ],
        },
      },
    },
    error: {
      on: {
        RETRY_USERS: { target: "loading" },
        LOAD_USERS: { target: "loading" },
      },
    },
  },
};
