export interface RoommateState {
  address: string;
  expectedShare: string;
  paidAmount: string;
  isPaid: boolean;
}

export interface ContractState {
  id: string;
  landlord: string;
  totalRent: string;
  deadline: string;
  /** Unix timestamp (seconds) of the deadline, for numeric comparison. */
  deadlineEpoch: number;
  status: "active" | "funded" | "released" | "expired";
  totalFunded: number;
  lastUpdate: string;
  roommates: RoommateState[];
}

export interface EscrowContract {
  id: string;
  landlord: string;
  totalRent: string;
  deadline: string;
  deadlineEpoch: number;
  status: "active" | "funded" | "released" | "expired";
  totalFunded: number;
}

export interface LandlordStats {
  totalEscrowed: number;
  activeEscrows: number;
  totalReleased: number;
}

export interface ContractBasicInfo {
  landlord: string;
  totalRent: string;
  deadline: string;
  token: string;
}
