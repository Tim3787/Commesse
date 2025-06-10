import React from "react";

const TabellaIndirizzamento = ({ data }) => {
  // Otteniamo tutte le intestazioni da tutte le righe
  const headers = Array.from(
    new Set(data.flatMap((row) => Object.keys(row)))
  );

  return (
    <div className="table-wrapper">
      <h2>Indirizzamento IP Linee</h2>
      <table className="ip-table">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header.toUpperCase()}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              {headers.map((header) => (
                <td key={header}>{row[header] !== undefined ? row[header] : "-"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const indirizzamenti = [
  {
    linea: "Unitech",
    PLC: 10,
    HMI: 7,
    Assistenza: 0,
    "11A1": 1,
    "13A1": 100,
    "15A1": 253,
    "16A1": 11,
    "31A1": 13,
    "32A1": 15,
    "60A1": 16,
    MAX: "…",
  },
  {
    linea: "Italmeccanica",
    PLC: 192,
    HMI: 168,
    Assistenza: 123,
    "11A1": 15,
    "13A1": 16,
    "15A1": 17,
    "16A1": 18,
    "31A1": 19,
    "32A1": 20,
    "60A1": 21,
    MAX: 49,
  },
  {
    linea: "PAYPER",
    PLC: 192,
    HMI: 168,
    Assistenza: 10,
    "11A1": 220,
    "13A1": 210,
    "15A1": 201,
    "16A1": 230,
    "31A1": 231,
    "32A1": 232,
    "60A1": 233,
    MAX: 249,
  },
];

const PagIndirizzamentoIP = () => {
  return <TabellaIndirizzamento data={indirizzamenti} />;
};


export default TabellaIndirizzamento;

