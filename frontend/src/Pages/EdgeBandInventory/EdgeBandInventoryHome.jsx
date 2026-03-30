import { useState, useContext } from "react";
import { AuthContext } from "../../Components/AuthContext";
import "../../css/EdgeBandInventory/EdgeBandInventoryHome.scss";
import EdgeBandInventoryList from "./EdgeBandInventoryList";
import AddEdgeBand from "./AddEdgeBand";
import BulkAddEdgeBand from "./BulkAddEdgeBand";
import AddEdgeBandStock from "./AddEdgeBandStock";
import EdgeBandLogs from "./EdgeBandLogs";

const EdgeBandInventoryHome = () => {
  const [activeView, setActiveView] = useState("edgebandInventory");
  const [editingEdgeBandInventory, setEditingEdgeBandInventory] = useState(null);
  const { user } = useContext(AuthContext);

  const canAccessButtons =
    user.role === "Editor" ||
    user.role === "Manager" ||
    user.role === "admin" ||
    user.role === "Edgebander";

  const isAdmin = user.role === "admin";

  const handleEditEdgeBandInventory = (row) => {
    setEditingEdgeBandInventory(row);
    setActiveView("editEdgeBandInventory");
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "edgebandInventory":
        return <EdgeBandInventoryList onEdit={handleEditEdgeBandInventory} />;

      case "addEdgeBand":
        return (
          <AddEdgeBand
            onSuccess={() => setActiveView("edgebandInventory")}
            onCancel={() => setActiveView("edgebandInventory")}
          />
        );

      case "editEdgeBandInventory":
        return (
          <AddEdgeBand
            mode="edit"
            initialData={editingEdgeBandInventory}
            onSuccess={() => {
              setEditingEdgeBandInventory(null);
              setActiveView("edgebandInventory");
            }}
            onCancel={() => {
              setEditingEdgeBandInventory(null);
              setActiveView("edgebandInventory");
            }}
          />
        );

      case "bulkAddEdgeBand":
        return (
          <BulkAddEdgeBand
            onCancel={() => setActiveView("edgebandInventory")}
          />
        );

      case "addEdgeBandStock":
        return (
          <AddEdgeBandStock
            onSuccess={() => setActiveView("edgebandInventory")}
            onCancel={() => setActiveView("edgebandInventory")}
          />
        );

      case "edgebandLogs":
        return <EdgeBandLogs />;

      default:
        return <EdgeBandInventoryList onEdit={handleEditEdgeBandInventory} />;
    }
  };

  return (
    <div className="inventory-home">
      <header className="inventory-header">
        <div className="inventory-header__container">
          <div className="inventory-header__title">
            <h1>Edgeband Inventory Management</h1>
            <h2>Edgeband Inventory · Add Edgeband · Bulk Add · Add Stock · Logs</h2>
          </div>

          <nav className="inventory-header__nav">
            <ul>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === "edgebandInventory" ? "active" : ""}`}
                  onClick={() => setActiveView("edgebandInventory")}
                >
                  Edgeband Inventory
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === "addEdgeBand" ? "active" : ""}`}
                  onClick={() => setActiveView("addEdgeBand")}
                  disabled={!canAccessButtons}
                  style={!canAccessButtons ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Add Edgeband
                </button>
              </li>
              {isAdmin && (
                <li>
                  <button
                    className={`inventory-header__nav-btn ${activeView === "bulkAddEdgeBand" ? "active" : ""}`}
                    onClick={() => setActiveView("bulkAddEdgeBand")}
                  >
                    Bulk Add
                  </button>
                </li>
              )}
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === "addEdgeBandStock" ? "active" : ""}`}
                  onClick={() => setActiveView("addEdgeBandStock")}
                  disabled={!canAccessButtons}
                  style={!canAccessButtons ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Add Edgeband Stock
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === "edgebandLogs" ? "active" : ""}`}
                  onClick={() => setActiveView("edgebandLogs")}
                >
                  Edgeband Logs
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="inventory-home__content">{renderActiveView()}</main>
    </div>
  );
};

export default EdgeBandInventoryHome;
