// Importing conext provider
import {AuthProvider} from "./AuthContext";

const Proivder = ({ children }: { children: React.ReactNode }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default Proivder;
