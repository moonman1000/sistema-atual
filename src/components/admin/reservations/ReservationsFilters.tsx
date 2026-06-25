import React from "react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Restaurant } from "@/context/RestaurantContext"; // Importar a interface Restaurant

interface ReservationsFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterStatus: string;
  onFilterStatusChange: (status: string) => void;
  sortBy: string;
  onSortByChange: (sort: string) => void;
  selectedRestaurantId: string | undefined;
  onSelectedRestaurantChange: (id: string | undefined) => void;
  isSuperAdmin: boolean;
  allRestaurants: Restaurant[];
  statusOptions: string[];
  sortOptions: { label: string; value: string }[];
}

const ReservationsFilters: React.FC<ReservationsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  selectedRestaurantId,
  onSelectedRestaurantChange,
  isSuperAdmin,
  allRestaurants,
  statusOptions,
  sortOptions,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        placeholder="Buscar por cliente, telefone ou notas..."
        className="max-w-sm flex-1"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      {isSuperAdmin && (
        <Select
          value={selectedRestaurantId || "Todos"}
          onValueChange={(value) => onSelectedRestaurantChange(value === "Todos" ? undefined : value)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos os Restaurantes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os Restaurantes</SelectItem>
            {allRestaurants.map((restaurant) => (
              <SelectItem key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            Status: {filterStatus} <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {statusOptions.map((status) => (
            <DropdownMenuItem key={status} onClick={() => onFilterStatusChange(status)}>
              {status}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            Ordenar por <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => onSortByChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ReservationsFilters;