/**
 * Barrel export para módulo de clientes recentes
 */

export { RecentCustomersTable } from "./RecentCustomersTable";
export { CustomerTableHeader } from "./CustomerTableHeader";
export { CustomerTableRow } from "./CustomerTableRow";
export { CustomerTableBody } from "./CustomerTableBody";
export { CustomerPagination } from "./CustomerPagination";
export { useCustomerPagination } from "./hooks/useCustomerPagination";
export { isEncryptedValue, formatPhone, exportCustomersToCSV } from "./utils/customerUtils";
export type { Customer, CustomerExportData } from "./types";
