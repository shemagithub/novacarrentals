import { createContext, useContext, useState } from "react";

export interface BookingSelection {
  vehicleName: string;
  vehicleId: string;
  fromDate: string;
  toDate: string;
  pricePerDay: number;
  destination?: string;
}

interface BookingContextType {
  selection: BookingSelection | null;
  setSelection: (s: BookingSelection | null) => void;
  widgetOpen: boolean;
  setWidgetOpen: (open: boolean) => void;
  triggerBooking: (payload: BookingSelection) => void;
}

const BookingContext = createContext<BookingContextType>({
  selection: null,
  setSelection: () => {},
  widgetOpen: false,
  setWidgetOpen: () => {},
  triggerBooking: () => {},
});

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<BookingSelection | null>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);

  function triggerBooking(payload: BookingSelection) {
    setSelection(payload);
    setWidgetOpen(true);
  }

  return (
    <BookingContext.Provider value={{ selection, setSelection, widgetOpen, setWidgetOpen, triggerBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  return useContext(BookingContext);
}
