import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";

export interface Reservation {
  id?: string;
  _id?: string;
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
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch reservations from the backend
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('http://localhost:5000/api/reservations', {
          headers: {
            Authorization: `Bearer ${token.replace('Bearer ', '').trim()}`
          }
        });

        if (response.data.success) {
          setReservations(response.data.reservations);
        }
      } catch (err) {
        console.error('Error fetching reservations:', err);
        setError('Failed to fetch reservations');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const addReservation = async (reservationData: Omit<Reservation, "id" | "status">) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('http://localhost:5000/api/reservations', 
        reservationData,
        {
          headers: {
            Authorization: `Bearer ${token?.replace('Bearer ', '').trim()}`
          }
        }
      );

      if (response.data.success) {
        setReservations(prev => [...prev, response.data.reservation]);
        toast.success("Reservation request submitted! Awaiting admin approval.");
      }
    } catch (err) {
      console.error('Error adding reservation:', err);
      toast.error('Failed to submit reservation');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationStatus = async (id: string, status: Reservation["status"], tableNumber?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `http://localhost:5000/api/reservations/${id}`,
        { status, tableNumber },
        {
          headers: {
            Authorization: `Bearer ${token?.replace('Bearer ', '').trim()}`
          }
        }
      );

      if (response.data.success) {        setReservations(prev => prev.map(reservation => 
          (reservation._id || reservation.id) === id 
            ? { ...reservation, status, ...(tableNumber && { tableNumber }) }
            : reservation
        ));
        toast.success(`Reservation ${status}`);
      }
    } catch (err) {
      console.error('Error updating reservation:', err);
      toast.error('Failed to update reservation');
    } finally {
      setLoading(false);
    }
  };

  const updateReservationDetails = async (id: string, updates: { time?: string; partySize?: string }) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put(
        `http://localhost:5000/api/reservations/${id}/details`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${token?.replace('Bearer ', '').trim()}`
          }
        }
      );

      if (response.data.success) {        setReservations(prev => prev.map(reservation => 
          (reservation._id || reservation.id) === id 
            ? { ...reservation, ...updates }
            : reservation
        ));
        toast.success('Reservation details updated');
      }
    } catch (err) {
      console.error('Error updating reservation details:', err);
      toast.error('Failed to update reservation details');
    } finally {
      setLoading(false);
    }
  };

  const getUserReservations = (userEmail?: string) => {
    if (!userEmail) return [];
    return reservations.filter(res => res.email === userEmail);
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
