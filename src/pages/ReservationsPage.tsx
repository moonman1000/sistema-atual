import React, { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import AddReservationDialog from "@/components/admin/AddReservationDialog";
import EditReservationDialog from "@/components/admin/EditReservationDialog";
import ViewReservationDetailsDialog from "@/components/admin/ViewReservationDetailsDialog";
import ReservationsHeader from "@/components/admin/reservations/ReservationsHeader";
import ReservationsFilters from "@/components/admin/reservations/ReservationsFilters";
import ReservationsTable from "@/components/admin/reservations/ReservationsTable";
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/context/SessionContext';
import { useRestaurant } from '@/context/RestaurantContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Importar Select

interface Reservation {
  id: string;
  clientname: string; // Corrigido para snake_case
  clientphone: string; // Corrigido para snake_case
  numberofguests: number; // Corrigido para snake_case
  reservationdate: string; // YYYY-MM-DD, Corrigido para snake_case
  reservationtime: string; // HH:MM, Corrigido para snake_case
  status: "Confirmada" | "Pendente" | "Cancelada" | "Concluída" | "Devolvido"; // NOVO: Adicionado Devolvido
  notes?: string;
  tablenumber?: string; // Corrigido para snake_case
  restaurant_id: string;
  created_at?: string;
  updated_at?: string;
}

const statusOptions = ["Todos", "Pendente", "Confirmada", "Concluída", "Cancelada", "Devolvido"]; // NOVO: Adicionado Devolvido
const sortOptions = [
  { label: "Data e Hora (Crescente)", value: "date-time-asc" },
  { label: "Data e Hora (Decrescente)", value: "date-time-desc" },
  { label: "Nº Pessoas (Crescente)", value: "guests-asc" },
  { label: "Nº Pessoas (Decrescente)", value: "guests-desc" },
];

const ReservationsPage = () => {
  const { session, isAdmin, isLoading: isLoadingSession, isSuperAdmin } = useSession();
  const { currentRestaurant, allRestaurants, isLoadingRestaurants, fetchAllRestaurants } = useRestaurant();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [sortBy, setSortBy] = useState("date-time-asc");
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | undefined>(undefined);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  // Efeito para definir o selectedRestaurantId inicial para super_admin ou admin
  useEffect(() => {
    if (isSuperAdmin && allRestaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(allRestaurants[0].id);
    } else if (isAdmin && currentRestaurant?.id && !selectedRestaurantId) {
      setSelectedRestaurantId(currentRestaurant.id);
    }
  }, [isSuperAdmin, isAdmin, allRestaurants, currentRestaurant?.id, selectedRestaurantId]);

  const fetchReservations = useCallback(async () => {
    setIsLoadingReservations(true);
    console.log("ReservationsPage: fetchReservations called.");
    console.log("  session:", session ? "present" : "null");
    console.log("  isAdmin:", isAdmin);
    console.log("  isSuperAdmin:", isSuperAdmin);
    console.log("  currentRestaurant?.id:", currentRestaurant?.id);
    console.log("  selectedRestaurantId (for fetch):", selectedRestaurantId);

    let query = supabase.from('reservations').select('*');
    let targetRestaurantIdForQuery: string | undefined;

    if (isSuperAdmin) {
      if (selectedRestaurantId) {
        query = query.eq('restaurant_id', selectedRestaurantId);
        targetRestaurantIdForQuery = selectedRestaurantId;
        console.log("ReservationsPage: Super Admin detectado, filtrando por selectedRestaurantId:", selectedRestaurantId);
      } else {
        console.log("ReservationsPage: Super Admin detectado, mas nenhum restaurante selecionado, buscando todas as reservas.");
      }
    } else if (isAdmin && currentRestaurant?.id) {
      query = query.eq('restaurant_id', currentRestaurant.id);
      targetRestaurantIdForQuery = currentRestaurant.id;
      console.log("ReservationsPage: Admin detectado, buscando reservas para currentRestaurant.id:", currentRestaurant.id);
    } else {
      setReservations([]);
      setIsLoadingReservations(false);
      console.log("ReservationsPage: Não autorizado (não admin/super_admin), ou nenhum restaurante selecionado para admin, limpando reservas.");
      return;
    }

    const { data, error } = await query
      .order('reservationdate', { ascending: true }) // Corrigido para snake_case
      .order('reservationtime', { ascending: true }); // Corrigido para snake_case

    if (error) {
      console.error("Erro ao carregar reservas:", error);
      console.error("Supabase error details (fetchReservations):", error.details, error.hint, error.message);
      toast.error("Erro ao carregar reservas.");
      setReservations([]);
    } else {
      setReservations(data as Reservation[]);
    }
    setIsLoadingReservations(false);
  }, [session, isAdmin, isSuperAdmin, currentRestaurant?.id, selectedRestaurantId]);

  useEffect(() => {
    let cancelled = false;
    const runFetch = async () => {
      if (isLoadingSession || isLoadingRestaurants) {
        if (!cancelled) {
          setReservations([]);
          setIsLoadingReservations(true);
        }
        return;
      }
      if (session && (isAdmin || isSuperAdmin)) {
        if (isSuperAdmin) {
          await fetchAllRestaurants();
        }
        await fetchReservations();
      } else {
        if (!cancelled) {
          setReservations([]);
          setIsLoadingReservations(false);
        }
      }
    };
    runFetch();
    return () => { cancelled = true; };
  }, [isLoadingSession, isLoadingRestaurants, session, isAdmin, isSuperAdmin, currentRestaurant?.id, selectedRestaurantId, fetchAllRestaurants, fetchReservations]);

  const filteredReservations = useMemo(() => {
    let currentReservations = reservations;

    if (searchTerm) {
      currentReservations = currentReservations.filter(
        (res) =>
          res.clientname.toLowerCase().includes(searchTerm.toLowerCase()) || // Corrigido para snake_case
          res.clientphone.toLowerCase().includes(searchTerm.toLowerCase()) || // Corrigido para snake_case
          res.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.tablenumber?.toLowerCase().includes(searchTerm.toLowerCase()) // Corrigido para snake_case
      );
    }

    if (filterStatus !== "Todos") {
      currentReservations = currentReservations.filter((res) => res.status === filterStatus);
    }

    currentReservations.sort((a, b) => {
      if (sortBy === "date-time-asc") {
        const dateA = new Date(`${a.reservationdate}T${a.reservationtime}`); // Corrigido para snake_case
        const dateB = new Date(`${b.reservationdate}T${b.reservationtime}`); // Corrigido para snake_case
        return dateA.getTime() - dateB.getTime();
      }
      if (sortBy === "date-time-desc") {
        const dateA = new Date(`${a.reservationdate}T${a.reservationtime}`); // Corrigido para snake_case
        const dateB = new Date(`${b.reservationdate}T${b.reservationtime}`); // Corrigido para snake_case
        return dateB.getTime() - dateA.getTime();
      }
      if (sortBy === "guests-asc") {
        return a.numberofguests - b.numberofguests; // Corrigido para snake_case
      }
      if (sortBy === "guests-desc") {
        return b.numberofguests - a.numberofguests; // Corrigido para snake_case
      }
      return 0;
    });

    return currentReservations;
  }, [searchTerm, filterStatus, sortBy, reservations]);

  const getRestaurantIdForAction = useCallback(() => {
    if (isAdmin && currentRestaurant?.id) {
      return currentRestaurant.id;
    }
    if (isSuperAdmin && selectedRestaurantId) {
      return selectedRestaurantId;
    }
    return undefined;
  }, [isAdmin, isSuperAdmin, currentRestaurant?.id, selectedRestaurantId]);

  const handleAddReservation = async (newReservationData: Omit<Reservation, 'id' | 'restaurant_id' | 'created_at' | 'updated_at'>) => {
    const restaurantIdToUse = getRestaurantIdForAction();
    if (!restaurantIdToUse) {
      toast.error("Nenhum restaurante selecionado para adicionar reserva.");
      return;
    }

    setIsLoadingReservations(true);
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        ...newReservationData,
        restaurant_id: restaurantIdToUse,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao adicionar reserva:", error);
      toast.error("Erro ao adicionar reserva: " + error.message);
    } else {
      setReservations(prev => [...prev, data as Reservation]);
      toast.success("Reserva adicionada com sucesso!");
    }
    setIsLoadingReservations(false);
  };

  const handleEditReservation = async (updatedReservation: Reservation) => {
    const restaurantIdToUse = getRestaurantIdForAction();
    if (!restaurantIdToUse || updatedReservation.restaurant_id !== restaurantIdToUse) {
      toast.error("Acesso não autorizado para atualizar esta reserva ou restaurante incorreto.");
      return;
    }

    setIsLoadingReservations(true);
    const { error } = await supabase
      .from('reservations')
      .update({
        clientname: updatedReservation.clientname, // Corrigido para snake_case
        clientphone: updatedReservation.clientphone, // Corrigido para snake_case
        numberofguests: updatedReservation.numberofguests, // Corrigido para snake_case
        reservationdate: updatedReservation.reservationdate, // Corrigido para snake_case
        reservationtime: updatedReservation.reservationtime, // Corrigido para snake_case
        status: updatedReservation.status,
        notes: updatedReservation.notes,
        tablenumber: updatedReservation.tablenumber, // Corrigido para snake_case
        updated_at: new Date().toISOString(),
      })
      .eq('id', updatedReservation.id)
      .eq('restaurant_id', restaurantIdToUse);

    if (error) {
      console.error("Erro ao atualizar reserva:", error);
      toast.error("Erro ao atualizar reserva: " + error.message);
    } else {
      setReservations(prev => prev.map(res => (res.id === updatedReservation.id ? updatedReservation : res)));
      toast.success("Reserva atualizada com sucesso!");
    }
    setIsLoadingReservations(false);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setViewingReservation(reservation);
    setIsViewDetailsDialogOpen(true);
  };

  const openEditDialog = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setIsEditDialogOpen(true);
  };

  const handleCancelReservation = async (reservationId: string) => {
    const restaurantIdToUse = getRestaurantIdForAction();
    if (!restaurantIdToUse) {
      toast.error("Nenhum restaurante selecionado para cancelar reserva.");
      return;
    }

    setIsLoadingReservations(true);
    const { error } = await supabase
      .from('reservations')
      .update({ status: "Cancelada", updated_at: new Date().toISOString() })
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantIdToUse);

    if (error) {
      console.error("Erro ao cancelar reserva:", error);
      toast.error("Erro ao cancelar reserva: " + error.message);
    } else {
      setReservations(prev =>
        prev.map(res =>
          res.id === reservationId ? { ...res, status: "Cancelada" } : res
        )
      );
      toast.info(`Reserva ${reservationId} foi cancelada.`);
    }
    setIsLoadingReservations(false);
  };

  const handleDeleteReservation = async (reservationId: string) => {
    const restaurantIdToUse = getRestaurantIdForAction();
    if (!restaurantIdToUse) {
      toast.error("Nenhum restaurante selecionado para excluir reserva.");
      return;
    }

    setIsLoadingReservations(true);
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId)
      .eq('restaurant_id', restaurantIdToUse);

    if (error) {
      console.error("Erro ao excluir reserva:", error);
      toast.error("Erro ao excluir reserva: " + error.message);
    } else {
      setReservations(prev => prev.filter(res => res.id !== reservationId));
      toast.success(`Reserva ${reservationId} foi excluída.`);
    }
    setIsLoadingReservations(false);
  };

  if (isLoadingReservations || isLoadingSession || isLoadingRestaurants) {
    return <div className="flex min-h-screen items-center justify-center">Carregando reservas...</div>;
  }

  return (
    <div className="space-y-6">
      <ReservationsHeader
        onAddReservationClick={() => setIsAddDialogOpen(true)}
        onRefreshClick={fetchReservations}
      />

      <ReservationsFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        selectedRestaurantId={selectedRestaurantId}
        onSelectedRestaurantChange={setSelectedRestaurantId}
        isSuperAdmin={isSuperAdmin}
        allRestaurants={allRestaurants}
        statusOptions={statusOptions}
        sortOptions={sortOptions}
      />

      <ReservationsTable
        reservations={filteredReservations}
        onViewDetails={handleViewDetails}
        onOpenEditDialog={openEditDialog}
        onCancelReservation={handleCancelReservation}
        onDeleteReservation={handleDeleteReservation}
      />

      <AddReservationDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAddReservation={handleAddReservation}
        currentRestaurantId={isAdmin ? currentRestaurant?.id : selectedRestaurantId}
        availableRestaurants={allRestaurants}
        isSuperAdmin={isSuperAdmin}
      />

      <ViewReservationDetailsDialog
        isOpen={isViewDetailsDialogOpen}
        onClose={() => setIsViewDetailsDialogOpen(false)}
        reservation={viewingReservation}
      />

      {editingReservation && (
        <EditReservationDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          reservation={editingReservation}
          onEditReservation={handleEditReservation}
          currentRestaurantId={isAdmin ? currentRestaurant?.id : selectedRestaurantId}
          availableRestaurants={allRestaurants}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </div>
  );
};

export default ReservationsPage;