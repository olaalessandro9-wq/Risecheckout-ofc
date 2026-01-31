/**
 * Shared for get-users-with-emails
 */
export function calculatePagination(total: number, page: number, limit: number) {
  return { offset: (page - 1) * limit, totalPages: Math.ceil(total / limit) };
}
export function filterBySearch(users: {email: string; name: string | null}[], search: string) {
  const term = search.toLowerCase().trim();
  if (!term) return users;
  return users.filter(u => u.email.toLowerCase().includes(term) || (u.name?.toLowerCase().includes(term) ?? false));
}
export function filterByStatus(users: {account_status: string}[], status: string) {
  if (status === "all") return users;
  return users.filter(u => u.account_status === status);
}
