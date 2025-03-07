/* eslint-disable no-unused-vars */
import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Select from "react-select";
import "../../css/TLFInventoryFixer/TLFInventoryFixerForm.scss";
import { AuthContext } from "../../Components/AuthContext";
import ErrorModal from "../../Components/ErrorModal";

const EditTLFInventoryFixer = () => {
  const [boardCode, setBoardCode] = useState(null);
  const [qtyToFix, setQtyToFix] = useState("");
  const [inventoryData, setInventoryData] = useState([]);
  const [backendError, setBackendError] = useState("");
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { id } = useParams();

  const canEditInventoryFixer = user.role === "Editor" || user.role === "admin";

  const fetchTLFInventory = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/TLFInventory`
      );
      const boards = response.data[0]?.boards || [];
      setInventoryData(
        boards.map((board) => ({
          value: board.BoardCode,
          label: board.BoardCode,
        }))
      );
    } catch (error) {
      console.error("Error fetching TLF Inventory data:", error);
      setErrorModalOpen(true);
    }
  };

  const fetchInventoryFixerData = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer/${id}`
      );
      const data = response.data;
      setBoardCode({ value: data.BoardCode, label: data.BoardCode });
      setQtyToFix(data.QtytoFix);
    } catch (error) {
      console.error("Error fetching inventory fixer data:", error);
      setErrorModalOpen(true);
    }
  };

  useEffect(() => {
    fetchTLFInventory();
    if (id) {
      fetchInventoryFixerData();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!boardCode) {
      setBackendError("Board Code is required.");
      return;
    }

    try {
      const tlfinventoryFixerData = {
        BoardCode: boardCode.value,
        QtytoFix: qtyToFix,
      };

      // Fetch the original TLF Inventory Fixer data
      const originalResponse = await axios.get(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer/${id}`
      );
      const originaltlfinventoryFixerData = originalResponse.data;

      // Update the TLF Inventory Fixer
      const response = await axios.put(
        `${import.meta.env.VITE_APP_ROUTE}/tlfinventoryfixer/${id}`,
        tlfinventoryFixerData
      );

      // Log the action
      await axios.post(`${import.meta.env.VITE_APP_ROUTE}/logs/add`, {
        user: user.username,
        action: `Updated TLF Inventory Fixer: ${boardCode.value}`,
        previousData: originaltlfinventoryFixerData,
        updatedData: tlfinventoryFixerData,
      });

      navigate("/manage/tlfInventoryFixerList");
    } catch (error) {
      console.error("Error updating TLF Inventory Fixer:", error);
      setBackendError(
        error.response?.data?.message ||
          "An error occurred while updating the TLF Inventory Fixer."
      );
    }
  };

  return (
    <div>
      <ErrorModal
        message={backendError}
        onClose={() => setBackendError("")}
        show={!!backendError}
      />
      <div className="tlf-inventory-fixer-form">
        <h1>Edit TLF Inventory Fixer</h1>
        {canEditInventoryFixer ? (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="boardCode">Board Code:</label>
              <Select
                id="boardCode"
                options={inventoryData}
                value={boardCode}
                onChange={setBoardCode}
                placeholder="Select Board Code"
                isSearchable
                className="react-select__control"
                required
              />
            </div>
            <div>
              <label htmlFor="qtyToFix">Quantity to Fix:</label>
              <input
                type="number"
                id="qtyToFix"
                value={qtyToFix}
                onChange={(e) => setQtyToFix(e.target.value)}
                required
              />
            </div>
            <button type="submit">Update TLF Inventory Fixer</button>
          </form>
        ) : (
          "You do not have permission to edit a TLF Inventory Fixer. Please contact an administrator for assistance."
        )}
      </div>
    </div>
  );
};

export default EditTLFInventoryFixer;
