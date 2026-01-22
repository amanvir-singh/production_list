import InventoryList from "./InventoryList";
import TLFInventory from "../TLFInventory/TLFInventory";
import AddInventoryMaterial from "./AddInventoryMaterial";
import AddMaterialOrder from "./AddMaterialOrder";
import "../../css/Inventory/InventoryHome.scss";
import { useState } from "react";

const InventoryHome = () => {
  const [activeView, setActiveView] = useState("warehouse");
  const [editingInventory, setEditingInventory] = useState(null);

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
      case "materialOnOrder":
        return <div>Material on Order (coming soon)</div>;
      case "orderHistory":
        return <div>Order History (coming soon)</div>;
      case "createOrder":
        return <AddMaterialOrder />;
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
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("warehouse")}
                >
                  Warehouse Inventory
                </button>
              </li>
              <li>
                <button
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("tlf")}
                >
                  TLF
                </button>
              </li>
              <li>
                <button
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("materialOnOrder")}
                >
                  Material on Order
                </button>
              </li>
              <li>
                <button
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("orderHistory")}
                >
                  Order History
                </button>
              </li>
              <li>
                <button
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("createOrder")}
                >
                  Create Order
                </button>
              </li>
              <li>
                <button
                  className="inventory-header__nav-btn"
                  onClick={() => setActiveView("addMaterial")}
                >
                  Add Material
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
