import { createContext, useContext, useState } from "react";

export interface BookingSelection {
  vehicleName: string;
  vehicleId: string;
  fromDate: string;
  toDate: string;
  pricePerDay: number;
}

interface BookingContextType {
  selection: BookingSelection | null;
  setSelection: (s: BookingSelection | null) => void;
}

const BookingContext = createContext<BookingContextType>({
  selection: null,
  setSelection: () => {},
});

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  return (
    <BookingContext.Provider value={{ selection, setSelection }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
