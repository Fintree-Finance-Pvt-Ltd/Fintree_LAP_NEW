import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { AppProviders } from "./app/providers.jsx";
import { router } from "./app/router.jsx";
import "./styles/index.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnFocusLoss={false}
      pauseOnHover
      draggable
      theme="light"
      limit={3}
    />{" "}
      <RouterProvider router={router} />
    </AppProviders>
  </React.StrictMode>,
);
