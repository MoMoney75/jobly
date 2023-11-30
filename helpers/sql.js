const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/*
FUNCTION FOR UPDATE QUERIES IN SQL
*/
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);

  /**
   * CHECKS TO SEE IF ANY DATA IS ENTERED AND THROW ERROR IF NO
   */
  if (keys.length === 0) throw new BadRequestError("No data");

  /**
   * ELSE:
   */
  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const columns = keys.map((columnName, index) =>
      `"${jsToSql[columnName] || columnName}" = $${index + 1}`,
  );

  return {
    setColumns: columns.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
