import React from "react";
import { Navigate, Outlet } from "react-router-dom";

function PrivateRoute() {
    const isSuperuser = localStorage.getItem("isSuperuser") === "true";

    return isSuperuser ? <Outlet /> : <Navigate to="/" />;
}

export default PrivateRoute;
