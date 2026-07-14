import { useState, useEffect } from "react";
import { get } from "../../api";
import Table from "../../components/Table";

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getLoans();
  }, []);

  const getLoans = async () => {
    try {
      const data = await get("/manager/instrument-loans");
      setLoans(data);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div>
      <h2>Instrument Loans</h2>
      {error && <p className="error-text">{error}</p>}

      <Table
        columns={[
          { key: "instrument_name", label: "Instrument" },
          { key: "student_name", label: "Student" },
          { key: "borrowed_at", label: "Borrowed At" },
          { key: "due_date", label: "Due Date" },
          {
            key: "returned_at",
            label: "Returned At",
            render: (row) => { // render: (row) => row.returned_at ? row.returned_at : "Not returned yet"
              if (row.returned_at) {
                return row.returned_at;
              } else {
                return "Not returned yet";
              }
            },
          },
        ]}
        rows={loans}
      />
    </div>
  );
}
