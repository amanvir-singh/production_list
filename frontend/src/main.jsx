import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Header from "./Components/Header.jsx";
import { AuthProvider } from "./Components/AuthContext.jsx";
import io from "socket.io-client";
import "./index.css";
import Login from "./Pages/Login.jsx";
import Signup from "./Pages/Signup.jsx";
import SupplierList from "./Pages/Suppliers/SuppliersList";
import AddSupplier from "./Pages/Suppliers/AddSupplier";
import EditSupplier from "./Pages/Suppliers/EditSupplier";
import FinishesList from "./Pages/Finishes/FinishesList";
import AddFinish from "./Pages/Finishes/AddFinish";
import EditFinish from "./Pages/Finishes/EditFinish";
import ThicknessesList from "./Pages/Thicknesses/ThicknessesList";
import AddThickness from "./Pages/Thicknesses/AddThickness";
import EditThickness from "./Pages/Thicknesses/EditThickness";
import UsersList from "./Pages/Users/UsersList";
import AddUser from "./Pages/Users/AddUser";
import EditUser from "./Pages/Users/EditUser";
import MaterialsList from "./Pages/Materials/MaterialsList.jsx";
import AddMaterial from "./Pages/Materials/AddMaterial.jsx";
import EditMaterial from "./Pages/Materials/EditMaterial.jsx";
import JobStatusIndicatorList from "./Pages/JobStatusIndicators/JobStatusIndicatorList.jsx";
import AddJobStatusIndicator from "./Pages/JobStatusIndicators/AddJobStatusIndicator.jsx";
import EditJobStatusIndicator from "./Pages/JobStatusIndicators/EditJobStatusIndicator.jsx";
import StockStatusIndicatorList from "./Pages/StockStatusIndicators/StockStatusIndicatorList.jsx";
import AddStockStatusIndicator from "./Pages/StockStatusIndicators/AddStockStatusIndicator.jsx";
import EditStockStatusIndicator from "./Pages/StockStatusIndicators/EditStockStatusIndicator.jsx";
import ProductionList from "./Pages/ProductionList/ProductionList.jsx";
import ProductionListForm from "./Pages/ProductionList/ProductionListForm.jsx";
import { useNavigate } from "react-router-dom";
import PreProd from "./Pages/PreProd/PreProd.jsx";
import LogList from "./Pages/Logs/LogList.jsx";
import TLFInventory from "./Pages/TLFInventory/TLFInventory.jsx";
import TLFInventoryFixerList from "./Pages/TLFInventoryFixer/TLFInventoryFixerList.jsx";
import AddTLFInventoryFixer from "./Pages/TLFInventoryFixer/AddTLFInventoryFixer.jsx";
import EditTLFInventoryFixer from "./Pages/TLFInventoryFixer/EditTLFInventoryFixer.jsx";
import JobList from "./Pages/JobList/JobList.jsx";
import AddJob from "./Pages/JobList/AddJob.jsx";
import EdgebandList from "./Pages/Edgebands/EdgeBandsList.jsx";
import AddEdgeband from "./Pages/Edgebands/AddEdgeBand.jsx";
import EditEdgeband from "./Pages/Edgebands/EditEdgeBand.jsx.jsx";
import JobListMaterialList from "./Pages/JobListMaterials/JobListMaterialsList.jsx";
import AddJobListMaterial from "./Pages/JobListMaterials/AddJobListMaterial.jsx";
import EditJobListMaterial from "./Pages/JobListMaterials/EditJobListMaterial.jsx";
import EditJob from "./Pages/JobList/EditJob.jsx";

const AppWithEventListener = () => {
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState(null);

  const socket = io(`${import.meta.env.VITE_APP_ROUTE}`);

  useEffect(() => {
    const handleLogout = () => {
      window.location.reload();
    };

    const handleLoginSuccess = () => {
      window.location.reload();
    };

    window.addEventListener("logout", handleLogout);
    window.addEventListener("loginSuccess", handleLoginSuccess);

    // Socket.io event listener
    socket.on("dataUpdated", (change) => {
      console.log("Data updated:", change);
      setLastUpdate(new Date().toISOString());
      window.location.reload();
    });

    return () => {
      window.removeEventListener("logout", handleLogout);
      window.removeEventListener("loginSuccess", handleLoginSuccess);
      socket.off("dataUpdated");
    };
  }, [navigate]);

  return (
    <>
      <Header />
      {lastUpdate && <div>Last updated: {lastUpdate}</div>}
      <Routes>
        <Route path="/" element={<ProductionList />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/manage/suppliersList" element={<SupplierList />} />
        <Route path="/add-supplier" element={<AddSupplier />} />
        <Route path="/edit-supplier/:id" element={<EditSupplier />} />
        <Route path="/manage/finishesList" element={<FinishesList />} />
        <Route path="/add-finish" element={<AddFinish />} />
        <Route path="/edit-finish/:id" element={<EditFinish />} />
        <Route path="/manage/thicknessesList" element={<ThicknessesList />} />
        <Route path="/add-thickness" element={<AddThickness />} />
        <Route path="/edit-thickness/:id" element={<EditThickness />} />
        <Route path="/manage/usersList" element={<UsersList />} />
        <Route path="/add-user" element={<AddUser />} />
        <Route path="/edit-user/:id" element={<EditUser />} />
        <Route path="/manage/materialsList" element={<MaterialsList />} />
        <Route path="/add-material" element={<AddMaterial />} />
        <Route path="/edit-material/:id" element={<EditMaterial />} />
        <Route
          path="/manage/jobStatusIndicatorsList"
          element={<JobStatusIndicatorList />}
        />
        <Route
          path="/add-job-status-indicator"
          element={<AddJobStatusIndicator />}
        />
        <Route
          path="/edit-job-status-indicator/:id"
          element={<EditJobStatusIndicator />}
        />
        <Route
          path="/manage/stockStatusIndicatorsList"
          element={<StockStatusIndicatorList />}
        />
        <Route
          path="/add-stock-status-indicator"
          element={<AddStockStatusIndicator />}
        />
        <Route
          path="/edit-stock-status-indicator/:id"
          element={<EditStockStatusIndicator />}
        />
        <Route path="/add-production-list" element={<ProductionListForm />} />
        <Route
          path="/edit-production-list/:id"
          element={<ProductionListForm />}
        />
        <Route path="/preprod" element={<PreProd />} />
        <Route path="InventoryTLF" element={<TLFInventory />} />
        <Route path="/manage/logsList" element={<LogList />} />
        <Route
          path="/manage/tlfinventoryfixerlist"
          element={<TLFInventoryFixerList />}
        />
        <Route
          path="/add-tlf-inventory-fixer"
          element={<AddTLFInventoryFixer />}
        />
        <Route
          path="/edit-tlf-inventory-fixer/:id"
          element={<EditTLFInventoryFixer />}
        />
        <Route path="/jobList" element={<JobList />} />
        <Route path="/add-job" element={<AddJob />} />
        <Route path="/manage/EdgeBandList" element={<EdgebandList />} />
        <Route path="/add-edgeband" element={<AddEdgeband />} />
        <Route path="/edit-edgeband/:id" element={<EditEdgeband />} />
        <Route
          path="/manage/jobListMaterialList"
          element={<JobListMaterialList />}
        />
        <Route path="/add-joblistmaterial" element={<AddJobListMaterial />} />
        <Route
          path="/edit-joblistmaterial/:id"
          element={<EditJobListMaterial />}
        />
        <Route path="/edit-job/:jobId" element={<EditJob />} />
      </Routes>
    </>
  );
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <Router>
        <AppWithEventListener />
      </Router>
    </AuthProvider>
  </StrictMode>
);
