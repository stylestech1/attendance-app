import { Message } from "./chat";

export type TUser = {
  id: string;
  name: string;
  active: 'boolean';
  email: string;
  phone: string;
  role: "admin" | "employee";
  position: string;
  jobId: number;
  hireDate: string;
  message?: Message
};
