/**
 * OrderBumpList Types
 * 
 * Tipos e interfaces para o componente OrderBumpList.
 * 
 * @module components/products/order-bump-list
 * @version 1.0.0
 * @see RISE Protocol V3 - Modularization (300-line limit)
 */

/**
 * OrderBump - Representação UI de um Order Bump
 */
export interface OrderBump {
  id: string;
  /** RISE V3: The product that owns this order bump */
  parent_product_id: string;
  /** @deprecated Use parent_product_id */
  checkout_id?: string | null;
  product_id: string;
  offer_id: string | null;
  position: number;
  active: boolean;
  product_name: string;
  product_price: number;
  product_image?: string;
  offer_name?: string;
  offer_price?: number;
}

/**
 * Props do componente OrderBumpList
 */
export interface OrderBumpListProps {
  productId: string;
  /** Dados iniciais do cache - evita fetch se disponíveis */
  initialOrderBumps?: OrderBump[];
  onAdd: () => void;
  onEdit?: (orderBump: OrderBump) => void;
  maxOrderBumps?: number;
  /** Callback para refresh após operações CRUD */
  onRefresh?: () => Promise<void>;
}

/**
 * Props do componente SortableOrderBumpItem
 */
export interface SortableOrderBumpItemProps {
  orderBump: OrderBump;
  index: number;
  onEdit?: (orderBump: OrderBump) => void;
  onRemove: (id: string) => void;
}

/**
 * Raw row do banco de dados
 */
export interface RawOrderBumpRow {
  id: string;
  /** RISE V3: The product that owns this order bump */
  parent_product_id: string;
  /** @deprecated Use parent_product_id */
  checkout_id?: string | null;
  product_id: string;
  offer_id: string | null;
  position: number;
  active: boolean;
  products?: {
    id: string;
    name: string;
    price: number;
    image_url?: string | null;
  } | null;
  offers?: {
    id: string;
    name: string;
    price: number;
  } | null;
}

/**
 * Response da API de listagem
 */
export interface OrderBumpsResponse {
  orderBumps?: RawOrderBumpRow[];
  error?: string;
}

/**
 * Response de operações CRUD
 */
export interface OrderBumpCrudResponse {
  success: boolean;
  error?: string;
}
