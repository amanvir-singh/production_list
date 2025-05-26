import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../css/PartLabels/LabelPreview.scss";
import axios from "axios";
import ZebraBrowserPrintWrapper from "zebra-browser-print-wrapper";

const LabelPreview = () => {
  const { fileName } = useParams();
  const [labels, setLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [labelprintloading, setLabelPrintLoading] = useState(false);
  const [imageMap, setImageMap] = useState({});

  useEffect(() => {
    if (labels.length === 0) return;

    const loadImages = async () => {
      const newImageMap = {};

      await Promise.all(
        labels.map((label) => {
          const img = new Image();
          const url = `${
            import.meta.env.VITE_APP_ROUTE
          }/partlabels/label-images/${label.partId}`;
          return new Promise((resolve) => {
            img.onload = () => {
              newImageMap[label.partId] = url;
              resolve();
            };
            img.onerror = () => {
              newImageMap[label.partId] = "/fallback.png";
              resolve();
            };
            img.src = url;
          });
        })
      );

      setImageMap(newImageMap);
    };

    loadImages();
  }, [labels]);

  // Fetching label data
  useEffect(() => {
    const fetchLabels = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_ROUTE}/partlabels/label-data/${fileName}`
        );
        setLabels(response.data);
      } catch (error) {
        console.error("Error loading label data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabels();
  }, [fileName]);

  const handlePrint = async (label) => {
    setLabelPrintLoading(true);

    try {
      // Fetch ZPL code from backend
      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/partlabels/print-label`,
        {
          labelData: label,
          partImage: imageMap[label.partId],
        }
      );

      const zplCode = response.data.zplCode;
      //console.log(zplCode);

      const browserPrint = new ZebraBrowserPrintWrapper();
      const defaultPrinter = await browserPrint.getDefaultPrinter();

      browserPrint.setPrinter(defaultPrinter);

      const status = await browserPrint.checkPrinterStatus();

      if (status.isReadyToPrint) {
        await browserPrint.print(zplCode);
      } else {
        const errorMessage = status.errors || "Unknown error";
        console.error("Printer not ready:", errorMessage);
        alert("Printer is not ready: " + errorMessage);
      }
    } catch (error) {
      console.error("Print failed:", error);
      alert("Failed to generate or send label.");
    } finally {
      setLabelPrintLoading(false);
    }
  };

  const handlePrintAll = async () => {
    setLabelPrintLoading(true);

    try {
      const labelsWithImages = labels.map((label) => ({
        labelData: label,
        partImage: imageMap[label.partId] || "/fallback.png",
      }));

      const response = await axios.post(
        `${import.meta.env.VITE_APP_ROUTE}/partlabels/print-label-batch`,
        { labels: labelsWithImages }
      );

      const zplCode = response.data.zplCode;

      const browserPrint = new ZebraBrowserPrintWrapper();
      const defaultPrinter = await browserPrint.getDefaultPrinter();

      browserPrint.setPrinter(defaultPrinter);

      const status = await browserPrint.checkPrinterStatus();

      if (status.isReadyToPrint) {
        await browserPrint.print(zplCode);
        alert("All labels sent to printer.");
      } else {
        const errorMessage = status.errors || "Unknown error";
        console.error("Printer not ready:", errorMessage);
        alert("Printer is not ready: " + errorMessage);
      }
    } catch (error) {
      console.error("Batch print failed", error);
      alert("Failed to generate or send batch labels.");
    } finally {
      setLabelPrintLoading(false);
    }
  };

  return (
    <div className="label-preview-page">
      <h2 className="page-title">{fileName}</h2>
      <div className="top-actions">
        <button className="btn-print-all" onClick={handlePrintAll}>
          {labelprintloading ? "Printing All..." : "Print All"}
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading label data...</div>
      ) : labels.length === 0 ? (
        <p>No labels found.</p>
      ) : (
        <div className="label-grid">
          {labels.map((label, index) => (
            <div key={label.id || index} className="label-card">
              <div className="label-preview">
                <img
                  src={imageMap[label.partId] || "/fallback.png"}
                  alt={`Part Image for ${label.partId} not found or failed to load`}
                  className="label-img"
                />
              </div>
              <div className="label-info">
                <p>
                  <strong>Job Name:</strong> {label.Job_Name}
                </p>
                <p>
                  <strong>Item Number:</strong> {label.itemNumber}
                </p>
                <p>
                  <strong>Part Name:</strong> {label.partName}
                </p>
                <p>
                  <strong>Part ID:</strong> {label.partId}
                </p>
                <p>
                  <strong>Cutrite Part ID:</strong> {label.cutritePartId}
                </p>
                <p>
                  <strong>Size:</strong> {label.size}
                </p>
                <p>
                  <strong>Material:</strong> {label.material}
                </p>
                <p>
                  <strong>Rotation:</strong> {label.rotation}
                </p>
                <button
                  className="btn-print"
                  onClick={() => handlePrint(label)}
                  disabled={loading}
                >
                  {labelprintloading ? "Printing..." : "Print Label"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabelPreview;
