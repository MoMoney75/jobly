"use strict";
const db = require("../db");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
} = require("../expressError");

class Jobs{
    /**
     * Get,Post,Update,Delete a job
     * data should be: title: text , salary: integer, equity: NUMERIC, 
     * 
     * Only is_admin can add,update or delete.
     */


    /**
     * Filter search results by salary,equity,title (ALL OPTIONAL)
     * Title uses likeness and case insensitive 
     * Returns title, salary, equity, company_handle AND company name
     *
     */
    static async findAll({salary,equity,title}= {}){
         let query = `SELECT title, salary, equity, company_handle,companies.name
                                 FROM jobs
                                 LEFT JOIN companies on companies.handle = jobs.company_handle` ; 

    /**
     * array to store optional query values and query string to add to SQL query
     */
         let queryExpressions = [];
         let queryValues = [];

           
             /**
            * If salary is in query string,
            * Push salary to array of queries, add the query to SQL query
            */
           if(salary !== undefined){
            queryValues.push(salary);
            queryExpressions.push(`salary >= $${queryValues.length}`);
           }

           /**
            * If equity is in query string && equity === true
            * Push equity to array of queries, add the query to SQL query
            */
           if(equity === true){
            queryValues.push(equity);
            queryExpressions.push(`equity > 0`)
           };

           /**
            * Uses likeness in title query, case-insensitive to filter by job title
            */
           if(title !== undefined){
            queryValues.push(`%${title}%`);
            queryExpressions.push(`title ILIKE $${queryValues.length}`)
           }

          /**
           * If filter queries are passed into query string, add 
           * the query to SQL query
           */
          if (queryExpressions.length > 0){
              query += " WHERE " + queryExpressions.join(" AND ");

            }

            query += " ORDER BY title";
            const job_results = await db.query(query, queryValues);
            return job_results.rows;
           

    }
    /**
     * 
     * Search for job by job ID
     * RETURNS title,salary,equity and company_handle 
     * 
     */
    static async get(id){
        const result = await db.query(`SELECT title, salary, equity, company_handle
                                 FROM jobs WHERE id = $1`,
                                 [id])


        const titles = result.rows
        if(titles.length === 0){
            throw new NotFoundError(`No jobs found with id of ${id}`)
        }
        return titles
                                 
    }


    /**
     * Checks for duplicate job posting --> throws error if job is duplicate
     * Creates to job from request body. Takes title,salary,equity,company_handle
     * 
     * 
     */
    static async post({title,salary,equity,company_handle}){
        const duplicateCheck = await db.query(
            `SELECT title,company_handle
             FROM jobs
             WHERE title = $1 AND company_handle = $2`,
          [title,company_handle]);
  
      if (duplicateCheck.rows.length > 0)
        throw new BadRequestError(`Duplicate job posting: ${title}, ${company_handle}`);
  
        const result = await db.query(`INSERT INTO jobs
                                     (title,salary,equity,company_handle)
                                      VALUES($1,$2,$3,$4) RETURNING title,salary,equity,company_handle`,
                                     [title,salary,equity,company_handle])

        const newJob = result.rows[0]
        

        return newJob
    }


    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle AS "companyHandle"`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job: ${id}`);
    
        return job;
      }
    


    static async remove(id){
        const result = await db.query(`DELETE FROM jobs
                                       WHERE id = $1 RETURNING *`,
                                       [id])
        let jobToDelete = result.rows[0];
         if(!jobToDelete){
            throw new NotFoundError(`Job with id of ${id} does not exist.`)
         }

         return {deleted : jobToDelete}
        
    }
}

module.exports = Jobs

    