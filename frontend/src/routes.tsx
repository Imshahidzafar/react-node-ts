import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Login from "./pages/auth/login";
import Register from "./pages/auth/register";
import AuthLayout from "./pages/auth/layout";
import ForgotPassword from "./pages/auth/forgotPassword";
import Dashboard from "./pages/admin/dasboard";
import AdminLayout from "./pages/admin/layout";
import Users from "./pages/admin/users";
import Auth from "./components/auth";
import NotFound from "@/pages/notFound";
import ResetPassword from "./pages/auth/resetPassword";
import Home from "./services/user/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Auth isAuth={false}>
        <AuthLayout />
      </Auth>
    ),
    children: [
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },   {
        path: "/reset-password",
        element: <ResetPassword />,
    },
    ],
  },
  {
    path: "/home",
    element: (
      <Auth isAuth={true}>
        <Home />
      </Auth>
    ),
  },
  {
    path: "/admin",
    element: (
      <Auth isAdmin={true}>
        <AdminLayout />
      </Auth>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "users",
        element: <Users />,
      },
    ]
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
