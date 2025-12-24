/**
 * Produtos - Página de Produtos Unificada
 * 
 * Todos os produtos, co-produções e afiliações em uma única view
 * com tabs integradas à barra de busca
 */

import { Helmet } from "react-helmet-async";
import { ProductsTable } from "@/components/products/ProductsTable";

const Produtos = () => {
  return (
    <>
      <Helmet>
        <title>Produtos - RiseCheckout</title>
      </Helmet>

      <div className="container mx-auto p-6">
        <ProductsTable />
      </div>
    </>
  );
};

export default Produtos;