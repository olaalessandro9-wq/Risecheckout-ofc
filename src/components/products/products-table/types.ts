/**
 * Types for ProductsTable components
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  status: "active" | "blocked" | "deleted";
  offers?: Array<{ price: number; is_default: boolean }>;
}

export type ProductTab = "meus-produtos" | "minhas-coproducoes" | "minhas-afiliacoes";

export interface UseProductsTableState {
  products: Product[];
  loading: boolean;
  searchQuery: string;
  statusFilter: string;
  activeTab: ProductTab;
  isAddDialogOpen: boolean;
  filteredProducts: Product[];
}

export interface UseProductsTableActions {
  setSearchQuery: (q: string) => void;
  setStatusFilter: (s: string) => void;
  setActiveTab: (t: ProductTab) => void;
  setIsAddDialogOpen: (open: boolean) => void;
  handleEdit: (id: string) => void;
  handleDuplicate: (id: string) => void;
  handleDelete: (id: string, name: string) => Promise<void>;
  loadProducts: () => Promise<void>;
}

export interface UseProductsTableMutations {
  duplicateIsPending: boolean;
  deleteIsPending: boolean;
}
