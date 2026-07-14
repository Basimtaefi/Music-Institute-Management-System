// Used AI to write a code for table.jsx to create generic tables that used in other classes :
export default function Table({ columns, rows }) {
  
  if (!rows || rows.length === 0) {
    return <p>No data available to display !</p>;
  }
  function getCellValue(column, row) {
    if (column.render) {
      return column.render(row);
    }
    else {
      return row[column.key];
    }
  }

  function getRowKey(row, index) {
    if (row.id) {
      return row.id;
    }
    else {
      return index;
    }
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key}>{column.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={getRowKey(row, index)}>
            {columns.map((column) => (
              <td key={column.key}>{getCellValue(column, row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
