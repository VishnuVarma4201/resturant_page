
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  partySize: string;
  specialRequests?: string;
  status: "pending" | "approved" | "rejected" | "delivered";
  tableNumber?: string;
}

interface ReservationContextType {
  reservations: Reservation[];
  addReservation: (reservation: Omit<Reservation, "id" | "status">) => void;
  updateReservationStatus: (id: string, status: Reservation["status"], tableNumber?: string) => void;
  updateReservationDetails: (id: string, updates: { time?: string; partySize?: string }) => void;
  getUserReservations: (userEmail?: string) => Reservation[];
}

const ReservationContext = createContext<ReservationContextType | undefined>(undefined);

export const ReservationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize reservations from localStorage if available
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const savedReservations = localStorage.getItem("reservations");
    return savedReservations ? JSON.parse(savedReservations) : [];
  });

  // Save reservations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("reservations", JSON.stringify(reservations));
  }, [reservations]);

  const addReservation = (reservationData: Omit<Reservation, "id" | "status">) => {
    const newReservation: Reservation = {
      ...reservationData,
      id: `RES-${Date.now()}`,
      status: "pending"
    };

    setReservations(prev => [...prev, newReservation]);
    toast.success("Reservation request submitted! Awaiting admin approval.");
  };

  const updateReservationStatus = (id: string, status: Reservation["status"], tableNumber?: string) => {
    setReservations(prev => 
      prev.map(reservation => 
        reservation.id === id 
          ? { ...reservation, status, ...(tableNumber && { tableNumber }) } 
          : reservation
      )
    );
    
    const statusMessage = {
      "approved": "Reservation approved",
      "rejected": "Reservation rejected",
      "delivered": "Reservation marked as delivered",
      "pending": "Reservation marked as pending"
    };
    
    toast.success(`${statusMessage[status]}${tableNumber ? ` and assigned to table ${tableNumber}` : ''}`);
  };

  const updateReservationDetails = (id: string, updates: { time?: string; partySize?: string }) => {
    setReservations(prev => 
      prev.map(reservation => 
        reservation.id === id 
          ? { ...reservation, ...updates } 
          : reservation
      )
    );
    
    toast.success("Reservation updated successfully");
  };

  const getUserReservations = (userEmail?: string) => {
    if (userEmail) {
      return reservations.filter(reservation => reservation.email === userEmail);
    }
    return reservations;
  };

  return (
    <ReservationContext.Provider value={{
      reservations,
      addReservation,
      updateReservationStatus,
      updateReservationDetails,
      getUserReservations
    }}>
      {children}
    </ReservationContext.Provider>
  );
};

export const useReservation = () => {
  const context = useContext(ReservationContext);
  if (context === undefined) {
    throw new Error("useReservation must be used within a ReservationProvider");
  }
  return context;
};
