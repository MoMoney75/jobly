"use strict";

const { query } = require("express");
const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   * Option filter methods[minEmployees,maxEmployees,name]
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    
           let query = 
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies`;
           
           let queryExpressions = [];
           let queryValues = [];
           const {min,max,name} = filters;
           
             /**
              * Throw error if min > max
              */
           if(min > max){
            throw new BadRequestError('minimum value must be less the maximum value')
           }
           /**
            * If minEmployees is in query string,
            * Push min to array of queries, add the query to SQL query
            */
           if(min !== undefined){
            queryValues.push(min);
            queryExpressions.push(`num_employees >= $${queryValues.length}`);
           }

           /**
            * If maxEmployees is in query string,
            * Push max to array of queries, add the query to SQL query
            */
           if(max !== undefined){
            queryValues.push(max);
            queryExpressions.push(`num_employees <= $${queryValues.length}`)
           };

           /**
            * Uses likeness in name, case-insensitive to filter by company name
            */
           if(name){
            queryValues.push(name);
            queryExpressions.push(`name ILIKE $${queryValues.length}`)
           }

          /**
           * If filter queries are passed into query string, add 
           * the query to SQL query
           */
          if (queryExpressions.length > 0){
              query += " WHERE " + queryExpressions.join(" AND ");

            }

            query += " ORDER BY name";
            const companiesRes = await db.query(query, queryValues);
            return companiesRes.rows;
           

  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
             
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl", jobs.title,
                  jobs.salary, jobs.equity
           FROM companies 
           LEFT JOIN jobs ON jobs.company_handle = companies.handle
           WHERE companies.handle = $1
           ORDER BY jobs.title`,
        [handle]);

    const company = companyRes.rows[0];

    if(!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (company.length === 0) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (company.length === 0) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
