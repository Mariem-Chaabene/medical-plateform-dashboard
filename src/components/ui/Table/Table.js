import "./Table.css";

export default function Table({
  columns,             // [{ label, key, render? }]
  data,                // Array d'objets
  searchable = true,   // search ?
  searchValue,
  onSearchChange,
  showCheckbox = false,
  onRowSelect,
  selectedRows = [],
  actions = [],        // [{icon, label, handler}]
}) {
  return (
    <div className="ui-table-wrapper">
      {searchable && (
        <div className="ui-table-searchbar">
          <input
            className="ui-table-search"
            type="text"
            placeholder="Quick search…"
            value={searchValue}
            onChange={e => onSearchChange?.(e.target.value)}
          />
        </div>
      )}
      <table className="ui-table">
        <thead>
          <tr>
            {showCheckbox && <th></th>}
            {columns.map(col => <th key={col.key}>{col.label}</th>)}
            {actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id || row.key}>
              {showCheckbox && (
                <td>
                  <input
                    type="checkbox"
                    checked={selectedRows?.includes(row.id)}
                    onChange={e => onRowSelect?.(row.id, e.target.checked)}
                  />
                </td>
              )}
              {/* Render columns */}
              {columns.map(col => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions.length > 0 &&
                <td className="ui-table-actions">
                  {actions.map(action => (
                    <button
                      key={action.label}
                      className="icon-btn"
                      title={action.label}
                      onClick={() => action.handler(row)}
                      style={action.style || {}}
                    >
                      {action.icon}
                    </button>
                  ))}
                </td>
              }
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
