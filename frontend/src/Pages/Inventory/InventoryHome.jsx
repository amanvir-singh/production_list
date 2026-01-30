import InventoryList from "./InventoryList";
import TLFInventory from "../TLFInventory/TLFInventory";
import AddInventoryMaterial from "./AddInventoryMaterial";
import MaterialonOrder from "./MaterialonOrder";
import OrderHistory from "./OrderHistory";
import MaterialtoOrder from "./MaterialtoOrder";
import AddMaterialOrder from "./AddMaterialOrder";
import AddStock from "./AddStock";
import OutfeedLogs from "./OutfeedLogs";
import OrphanPanels from "./OrphanPanels";
import "../../css/Inventory/InventoryHome.scss";
import { useState, useContext } from "react";
import { AuthContext } from "../../Components/AuthContext";
const InventoryHome = () => {
  const [activeView, setActiveView] = useState("warehouse");
  const [editingInventory, setEditingInventory] = useState(null);
  const { user } = useContext(AuthContext);

  const canAccessButtons = user.role === "Editor" || user.role === "admin";

  const handleEditInventory = (row) => {
    setEditingInventory(row);
    setActiveView("editInventory");
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "warehouse":
        return <InventoryList onEdit={handleEditInventory} />;
      case "tlf":
        return <TLFInventory />;
      case "materialToOrder":
        return <MaterialtoOrder />;
      case "materialOnOrder":
        return <MaterialonOrder />;
      case "orderHistory":
        return <OrderHistory />;
      case "createOrder":
        return <AddMaterialOrder onSuccess={() => setActiveView("materialToOrder")}/>;
      case "addMaterial":
        return (
          <AddInventoryMaterial onSuccess={() => setActiveView("warehouse")} />
        );
      case "editInventory":
        return (
          <AddInventoryMaterial
            mode="edit"
            initialData={editingInventory}
            onSuccess={() => {
              setEditingInventory(null);
              setActiveView("warehouse");
            }}
            onCancel={() => {
              setEditingInventory(null);
              setActiveView("warehouse");
            }}
          />
        );
      case "addStock":
        return (
          <AddStock onSuccess={() => setActiveView("warehouse")} />
        );
      case "outfeedLogs":
        return <OutfeedLogs />;
      case "orphanPanels":
        return <OrphanPanels />;
      default:
        return <InventoryList onEdit={handleEditInventory} />;
    }
  };

  return (
    <div className="inventory-home">
      <header className="inventory-header">
        <div className="inventory-header__container">
          <div className="inventory-header__title">
            <h1>Inventory Management</h1>
            <h2>Warehouse · TLF · Orders</h2>
          </div>

          <nav className="inventory-header__nav">
            <ul>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'warehouse' ? 'active' : ''}`}
                  onClick={() => setActiveView("warehouse")}
                >
                  Warehouse Inventory
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'tlf' ? 'active' : ''}`}
                  onClick={() => setActiveView("tlf")}
                >
                  TLF
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'createOrder' ? 'active' : ''}`}
                  onClick={() => setActiveView("createOrder")}
                  disabled={!canAccessButtons}
                  style={!canAccessButtons ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Create Order
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'materialToOrder' ? 'active' : ''}`}
                  onClick={() => setActiveView("materialToOrder")}
                >
                  Material to Order
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'materialOnOrder' ? 'active' : ''}`}
                  onClick={() => setActiveView("materialOnOrder")}
                >
                  Material on Order
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'orderHistory' ? 'active' : ''}`}
                  onClick={() => setActiveView("orderHistory")}
                >
                  Order History
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'addMaterial' ? 'active' : ''}`}
                  onClick={() => setActiveView("addMaterial")}
                  disabled={!canAccessButtons}
                  style={!canAccessButtons ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Add New Material
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'addStock' ? 'active' : ''}`}
                  onClick={() => setActiveView("addStock")}
                  disabled={!canAccessButtons}
                  style={!canAccessButtons ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  Add Stock
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'outfeedLogs' ? 'active' : ''}`}
                  onClick={() => setActiveView("outfeedLogs")}
                >
                  Outfeed Logs
                </button>
              </li>
              <li>
                <button
                  className={`inventory-header__nav-btn ${activeView === 'orphanPanels' ? 'active' : ''}`}
                  onClick={() => setActiveView("orphanPanels")}
                >
                  Orphan Panels
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

export default InventoryHome;
