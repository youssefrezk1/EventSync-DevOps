// app/dashboards/vendor/requestStatus/entities.ts

export interface BazaarEvent {
  _id: string;
  BazaarName?: {
    Name: string;
    StartDate: string;
    EndDate: string;
    Location: string;
  };
  VendorName?: {
    companyName: string;
    email: string;
  };
  Pending?: "Accept" | "Reject" | "Pending";
  createdAt?: string;
}

export interface BoothEvent {
  _id: string;
  VendorID?: {
    companyName: string;
    email: string;
  };
  Location: string;
  BoothSize: string;
  StartDate: string;
  EndDate: string;
  Pending?: "Accept" | "Reject" | "Pending";
  SetupDuration?: string;
  createdAt?: string;
}

// Union type so the frontend can treat both the same way
export type VendorEvent = BazaarEvent | BoothEvent;
