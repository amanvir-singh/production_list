/* eslint-disable react/prop-types */

const ProductionListTable = ({
  lists,
  onEdit,
  onDelete,
  onArchive,
  userRole,
}) => {
  const canEdit = ["Editor", "Manager", "admin"].includes(userRole);
  const canArchive = ["Editor", "admin"].includes(userRole);

  return (
    <table>
      <thead>
        <tr>
          <th>Cutlist Name</th>
          <th>Material</th>
          <th>Saw Quantity</th>
          <th>CNC Quantity</th>
          <th>Total Quantity</th>
          <th>Stock Status</th>
          <th>Job Status</th>
          <th>Priority</th>
          <th>Created At</th>
          <th>Updated At</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {lists.flatMap((list) =>
          list.materials.map((material, index) => (
            <tr key={`${list._id}-${index}`}>
              {index === 0 && (
                <>
                  <td rowSpan={list.materials.length}>{list.cutlistName}</td>
                  <td>
                    {material.material
                      ? material.material
                      : material.customMaterial}
                  </td>
                  <td>{material.quantitySaw}</td>
                  <td>{material.quantityCNC}</td>
                  <td>{material.quantitySaw + material.quantityCNC}</td>
                  <td rowSpan={list.materials.length}>{list.stockStatus}</td>
                  <td rowSpan={list.materials.length}>{list.jobStatus}</td>
                  <td rowSpan={list.materials.length}>{list.priority}</td>
                  <td rowSpan={list.materials.length}>
                    {new Date(list.createdAt).toLocaleDateString()}
                  </td>
                  <td rowSpan={list.materials.length}>
                    {new Date(list.updatedAt).toLocaleDateString()}
                  </td>
                  <td rowSpan={list.materials.length}>
                    {canEdit && (
                      <button onClick={() => onEdit(list)}>Edit</button>
                    )}
                    {canEdit && (
                      <button onClick={() => onDelete(list._id)}>Delete</button>
                    )}
                    {canArchive && (
                      <button onClick={() => onArchive(list._id)}>
                        Archive
                      </button>
                    )}
                  </td>
                </>
              )}
              {index !== 0 && (
                <>
                  <td>
                    {material.material
                      ? material.material.code
                      : material.customMaterial}
                  </td>
                  <td>{material.quantitySaw}</td>
                  <td>{material.quantityCNC}</td>
                  <td>{material.quantitySaw + material.quantityCNC}</td>
                </>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default ProductionListTable;
