/**
 * AdminTopSellersTable - Tabela de ranking de vendedores
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminTopSellers, PeriodFilter } from "@/hooks/useAdminAnalytics";
import { formatCentsToBRL } from "@/lib/money";
import { Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

interface AdminTopSellersTableProps {
  period: PeriodFilter;
}

export function AdminTopSellersTable({ period }: AdminTopSellersTableProps) {
  const { data: sellers, isLoading } = useAdminTopSellers(period);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-[#C0C0C0]" />; /* Silver - intentional hex for medal color */
    if (index === 2) return <Medal className="h-4 w-4 text-amber-700" />;
    return <span className="text-muted-foreground font-medium">{index + 1}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-2xl blur-2xl opacity-50" />
      <Card className="relative bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            Top Vendedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (sellers?.length || 0) > 0 ? (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-right">GMV</TableHead>
                    <TableHead className="text-right">Taxa 4%</TableHead>
                    <TableHead className="text-right">Pedidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers?.map((seller, index) => (
                    <TableRow key={seller.vendorId} className="hover:bg-muted/10">
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center w-6 h-6">
                          {getRankIcon(index)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{seller.vendorName}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-500">
                        {formatCentsToBRL(seller.totalGMV)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCentsToBRL(seller.totalFees)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {seller.ordersCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma venda no período selecionado
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
