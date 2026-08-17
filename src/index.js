import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { APP_BASENAME } from "./lib/constants";
import "./index.css";
import "mapbox-gl/dist/mapbox-gl.css";

if (window.location.pathname === "/") {
  window.location.replace(`${APP_BASENAME}/login`);
} else {
  const root = ReactDOM.createRoot(document.getElementById("root"));

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={APP_BASENAME}>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </React.StrictMode>
  );
}
