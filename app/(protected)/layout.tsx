import { Toaster } from "react-hot-toast";
import Navbar from "../components/navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      /> */}
    
      {children} 
    </>
  );
}