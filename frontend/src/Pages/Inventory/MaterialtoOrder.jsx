import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/Inventory/MaterialtoOrder.scss";
import { AuthContext } from "../../Components/AuthContext";
import MarkOrderedModal from "./MarkOrderedModal";
import AddMaterialOrder from "./AddMaterialOrder";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const MaterialtoOrder = () => {
  const { user } = useContext(AuthContext);
  const canManage = user.role === "Editor" || user.role === "admin";
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderToMark, setSelectedOrderToMark] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const printRef = useRef();

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_ROUTE}/materialOrders`);
      const toOrderItems = response.data
      .filter(o => o.status === "To Order")
      .sort((a, b) =>
        a.supplier.localeCompare(b.supplier, undefined, { sensitivity: "base" })
      );
      setOrders(toOrderItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteClick = (order) => {
    setItemToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_APP_ROUTE}/materialOrders/${itemToDelete._id}`);
      
       await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
         user: user.username,
         action: `Deleted To-Order Material: ${itemToDelete.boardCode}`,
         previousData: itemToDelete,
         updatedData: null
      });

      fetchOrders();
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Failed to delete order");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, "gi");
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>
    );
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
        (order.supplier || "").toLowerCase().includes(term) ||
        (order.code || "").toLowerCase().includes(term) ||
        (order.finish || "").toLowerCase().includes(term) ||
        (order.thickness || "").toLowerCase().includes(term) ||
        (order.format || "").toLowerCase().includes(term)
    );
  });

  if (editingOrder) {
      return (
          <div className="material-to-order-edit">
              <button className="back-btn" onClick={() => setEditingOrder(null)}>← Back to List</button>
              <AddMaterialOrder 
                mode="edit" 
                initialData={editingOrder} 
                onSuccess={() => {
                    setEditingOrder(null);
                    fetchOrders();
                }}
                onCancel={() => setEditingOrder(null)}
              />
          </div>
      )
  }

  return (
    
    <div className="material-to-order" ref={printRef}>
      <DeleteConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.boardCode || "this item"}
      />
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : orders.length === 0 ? (
        <p className="no-data">No materials waiting to be ordered.</p>
      ) : (
          <div className="table-container">
            <h1>Materials To Order</h1>
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' , marginRight: '15px'}}>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            /><button className="print-button" onClick={handlePrint}>
                        Print
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Supplier</th>
                        <th>Code</th>
                        <th>Finish</th>
                        <th>Thickness</th>
                        <th>Format</th>
                        <th>Qty to Order</th>
                        <th>Date Added</th>
                        {canManage && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(order => (
                        <tr key={order._id}>
                            <td>{highlightText(order.supplier, searchTerm)}</td>
                            <td>{highlightText(order.code, searchTerm)}</td>
                            <td>{highlightText(order.finish, searchTerm)}</td>
                            <td>{highlightText(order.thickness, searchTerm)}</td>
                            <td>{highlightText(order.format, searchTerm)}</td>
                            <td>{order.orderedQty}</td>
                            <td>{order.createdAt.split('T')[0]}</td>
                            {canManage && (
                                <td className="action-cell">
                                    <button 
                                        className="action-btn order"
                                        onClick={() => setSelectedOrderToMark(order)}
                                    >
                                        Mark Ordered
                                    </button>
                                    <button 
                                        className="action-btn edit"
                                        onClick={() => setEditingOrder(order)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="action-btn delete"
                                        onClick={() => handleDeleteClick(order)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {selectedOrderToMark && (
        <MarkOrderedModal
            isOpen={!!selectedOrderToMark}
            order={selectedOrderToMark}
            onClose={() => setSelectedOrderToMark(null)}
            onSuccess={() => {
                setSelectedOrderToMark(null);
                fetchOrders();
            }}
        />
      )}
    </div>
  );
};

export default MaterialtoOrder;
