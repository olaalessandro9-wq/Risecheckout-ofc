import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFilters() {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Select defaultValue="all">
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="pix">Pix</SelectItem>
          <SelectItem value="card">Cartão</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="all">
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue placeholder="Produtos" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="all">Todos os produtos</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="today">
        <SelectTrigger className="w-[180px] bg-card border-border">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7days">Últimos 7 dias</SelectItem>
          <SelectItem value="30days">Últimos 30 dias</SelectItem>
          <SelectItem value="90days">Últimos 90 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
