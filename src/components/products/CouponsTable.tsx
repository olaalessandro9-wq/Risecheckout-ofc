import { useState } from "react";
import { Search, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

// RISE V3: Datas opcionais para cupons sem expiração
export interface Coupon {
  id: string;
  code: string;
  discount: number;
  discountType: "percentage";
  startDate: Date | null;
  endDate: Date | null;
  applyToOrderBumps: boolean;
  usageCount: number;
}

interface CouponsTableProps {
  coupons: Coupon[];
  onAdd: () => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (id: string) => void;
}

export const CouponsTable = ({
  coupons,
  onAdd,
  onEdit,
  onDelete,
}: CouponsTableProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Pesquisar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
        <Button onClick={onAdd} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          Adicionar Cupom
        </Button>
      </div>

      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">
            Nenhum registro encontrado
          </p>
        </div>
      ) : (
        <>
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-foreground font-semibold">Código</TableHead>
                  <TableHead className="text-foreground font-semibold">Produtos</TableHead>
                  <TableHead className="text-foreground font-semibold">Desconto</TableHead>
                  <TableHead className="text-foreground font-semibold">Início</TableHead>
                  <TableHead className="text-foreground font-semibold">Fim</TableHead>
                  <TableHead className="text-foreground font-semibold"># Usos</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-foreground">
                      {coupon.code}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      -
                    </TableCell>
                    <TableCell className="text-primary font-semibold">
                      {`${coupon.discount}%`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.startDate ? format(coupon.startDate, "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.endDate ? format(coupon.endDate, "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {coupon.usageCount}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                          <DropdownMenuItem
                            onClick={() => onEdit(coupon)}
                            className="gap-2 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(coupon.id)}
                            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <span className="sr-only">Anterior</span>
              ‹
            </Button>
            <Button variant="default" size="icon" className="h-8 w-8">
              1
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled>
              <span className="sr-only">Próximo</span>
              ›
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
