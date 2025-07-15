import router from "./routes/Routes";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/authContext";

const App = () => {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;