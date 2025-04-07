/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import "../../css/ProductionList/FilterModal.scss";

const FilterModal = ({
  isOpen,
  onClose,
  onApply,
  jobList,
  currentFilters,
  ParentFunction,
}) => {
  const [localFilters, setLocalFilters] = useState(currentFilters);

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  if (!isOpen) return null;

  const availableFilters = {
    materials: Array.from(
      new Set(
        jobList.flatMap((job) =>
          job.partlist ? job.partlist.map((part) => part.material) : []
        )
      )
    ),
  };

  const handleFilterChange = (filterType, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((item) => item !== value)
        : [...prev[filterType], value],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  return (
    <div className="filter-modal">
      <div className="filter-modal-content">
        <h2>{ParentFunction}</h2>
        {Object.entries(availableFilters).map(([filterType, options]) => (
          <div key={filterType} className="filter-section">
            <h3>{filterType.charAt(0).toUpperCase() + filterType.slice(1)}</h3>
            {options.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={localFilters[filterType]?.includes(option) || false}
                  onChange={() => handleFilterChange(filterType, option)}
                />
                {option}
              </label>
            ))}
          </div>
        ))}
        <div className="filter-actions">
          <button onClick={handleApply}>Apply Filters</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
