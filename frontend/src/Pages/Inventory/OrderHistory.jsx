
import { useState, useEffect, useContext, useRef } from "react";
import axios from "axios";
import "../../css/Inventory/OrderHistory.scss";
import { AuthContext } from "../../Components/AuthContext";
import AddMaterialOrder from "./AddMaterialOrder";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const OrderHistory = () => {
  const { user } = useContext(AuthContext);
  const isAdmin = user.role === "admin";
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const printRef = useRef();
  
  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_APP_ROUTE}/materialOrders`);
      const historyItems = response.data.filter(o => 
          o.status === "Received" || o.status === "Cancelled"
      );
      setOrders(historyItems);
    } catch (error) {
      console.error("Error fetching order history:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_ROUTE}/suppliers`);
      setSuppliers(response.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteClick = (order) => {
    setItemToDelete(order);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_APP_ROUTE}/materialOrders/${itemToDelete._id}`);
      
       // Log delete
       await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Deleted History Order for ${itemToDelete.boardCode}`,
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

  const formatDate = (dateString) => {
    if(!dateString) return "Unknown";
    return dateString.split('T')[0];
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

  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const dateToUse = order.receivedDate || order.updatedAt;
    const dateKey = formatDate(dateToUse);
    const supplierKey =
      suppliers.find(s => s.code === order.supplier)?.name || 'Unknown'; 
    const key = `${dateKey}|${supplierKey}`;

    if (!groups[key]) {
      groups[key] = {
        date: dateToUse,
        displayDate: dateKey,
        supplier: supplierKey,
        items: []
      };
    }
    groups[key].items.push(order);
    return groups;
  }, {});
  const sortedGroups = Object.values(groupedOrders).sort((a, b) => {
     if (!a.date) return 1;
     if (!b.date) return -1;
     return new Date(b.date) - new Date(a.date); // Descending
  });

  if (editingOrder) {
    return (
        <div className="order-history-edit">
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
    <div className="order-history" ref={printRef}>
      <DeleteConfirmationModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        itemName={itemToDelete?.boardCode || "this history item"}
      />
      <div className="print-header">
        {user && <p>Printed by: {user.username}</p>}
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : sortedGroups.length === 0 && !searchTerm ? (
        <p className="no-data">No order history found.</p>
      ) : (
        <div className="order-groups">
          <h1>Order History</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
            <button className="print-button" onClick={handlePrint}>
                        Print
            </button>
          </div>
            {sortedGroups.map((group, index) => (
                <div key={index} className="order-group-block">
                    <div className="group-header">
                        <span className="date">Date Received: {group.displayDate}</span>
                        <span className="supplier">{group.supplier}</span>
                    </div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Supplier</th>
                                    <th>Code</th>
                                    <th>Status</th>
                                    <th>Finish</th>
                                    <th>Thickness</th>
                                    <th>Format</th>
                                    <th>Qty Ordered</th>
                                    <th>Qty Received</th>
                                    <th>Date Ordered</th>
                                    {isAdmin && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {group.items.map(order => (
                                    <tr key={order._id} className={`status-${order.status.toLowerCase()}`}>
                                        <td>{highlightText(order.supplier, searchTerm)}</td>
                                        <td>{highlightText(order.code, searchTerm)}</td>
                                        <td>
                                            <span className={`status-badge ${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td>{highlightText(order.finish, searchTerm)}</td>
                                        <td>{highlightText(order.thickness, searchTerm)}</td>
                                        <td>{highlightText(order.format, searchTerm)}</td>
                                        <td>{order.orderedQty}</td>
                                        <td>{order.receivedQty || '-'}</td> 
                                        <td>{formatDate(order.orderedDate)}</td>
                                        {isAdmin && (
                                            <td className="action-cell">
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
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
