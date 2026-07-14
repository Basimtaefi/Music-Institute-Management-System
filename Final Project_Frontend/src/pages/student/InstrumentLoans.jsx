import { useState, useEffect } from "react";
import { get, post, put } from "../../api";
import Table from "../../components/Table";

export default function InstrumentLoans() {
  const [loans, setLoans] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [newInstrumentId, setNewInstrumentId] = useState("");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    loadLoans();
    loadInstruments();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await get("/student/instrument-loans");
      setLoans(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadInstruments = async () => {
    try {
      const data = await get("/student/instruments");
      setInstruments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShowAddForm = () => {
    setShowAddForm(true);
  };

  const handleNewInstrumentIdChange = (event) => {
    const newText = event.target.value;
    setNewInstrumentId(newText);
  };

  const handleNewDueDateChange = (event) => {
    const newText = event.target.value;
    setNewDueDate(newText);
  };

  const handleAddLoan = async () => {
    try {
      await post("/student/instrument-loans", {
        instrument_id: newInstrumentId,
        due_date: newDueDate,
      });
      window.alert("Instrument has been borrowed !");
      handleCancelAdd();
      loadLoans();
      loadInstruments();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewInstrumentId("");
    setNewDueDate("");
  };

  const handleReturn = async (loanId) => {
    const confirmed = window.confirm("Are you sure you want to return this instrument?");
    if (!confirmed) {
      return;
    }
    try {
      await put(`/student/instrument-loans/${loanId}/return`);
      window.alert("Instrument has been returned!");
      loadLoans();
      loadInstruments();
    } catch (err) {
      setError(err.message);
    }
  };

  function getReturnedAtDisplay(row) {
    if (row.returned_at) {
      return row.returned_at;
    } else {
      return "Not returned yet";
    }
  }

  function getReturnAction(row) {
    if (row.returned_at) {
      return "Returned";
    } else {
      return <button type="button" onClick={() => handleReturn(row.id)}>Return</button>;
    }
  }

  return (
    <div>
      <h2>Instrument Loans</h2>
      {error && <p className="error-text">{error}</p>}

      {!showAddForm && (
        <button type="button" onClick={handleShowAddForm}>Borrow an Instrument</button>
      )}

      {showAddForm && (
        <div>
          <h3>Borrow an Instrument</h3>
          <label>Instrument:</label>
          <select value={newInstrumentId} onChange={handleNewInstrumentIdChange}>
            <option value="">Choose one option</option>
            {instruments.map((instrument) => (
              <option key={instrument.id} value={instrument.id}>
                {instrument.name}
              </option>
            ))}
          </select>

          <label>Due Date:</label>
          <input type="date" value={newDueDate} onChange={handleNewDueDateChange} />

          <button type="button" onClick={handleAddLoan}>Borrow</button>
          <button type="button" onClick={handleCancelAdd}>Cancel</button>
        </div>
      )}

      <Table
        columns={[
          { key: "name", label: "Instrument" },
          { key: "borrowed_at", label: "Borrowed At" },
          { key: "due_date", label: "Due Date" },
          {
            key: "returned_at",
            label: "Returned At",
            render: (row) => getReturnedAtDisplay(row),
          },
          {
            key: "actions",
            label: "",
            render: (row) => getReturnAction(row),
          },
        ]}
        rows={loans}
      />
    </div>
  );
}