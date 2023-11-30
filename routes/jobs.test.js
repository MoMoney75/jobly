"use strict";
const request = require("supertest");
const db = require("../db.js");
const app = require("../app");
const Jobs = require("../models/jobs");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
} = require("./_testCommon");
const { createECDH } = require("crypto");
const { describe } = require("node:test");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

let newJob = Jobs.post( 
  {
  "title" : "test_title80",
  "salary" : 90000,
  "equity" : 0,
  "company_handle" : "c1",
})

describe('GET /', function(){
  test("Get all job listings, no filters", async function(){
    const result =  await request(app).get('/jobs')
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual(
        {
        
          "jobs" : [  
            { 
              "title" : "test_title1",
              "salary": 10000,
              "equity" : "0",
              "company_handle" : "c1",
              "name": "C1"

            },
            {
              "title" : "test_title2",
              "salary": 20000,
              "equity" : "0",
              "company_handle" : "c2",
              "name": "C2"

            },
          
            {
              "title" : "test_title3",
              "salary": 30000,
              "equity" : "0",
              "company_handle" : "c3",
              "name": "C3"

            },
            {
              "title" : "test_title3",
              "salary" : 100000,
              "equity" : "0.8",
              "company_handle" : "c1",
              "name" : "C1"
            }]
          
        })

  
})

test('/ GET job by ID', async function(){
  const result = await request(app).get('/jobs/')
  // console.log(result.body)
  expect(result.statusCode).toBe(200)
})

test('/GET id, id does not exist', async function(){
  const result = await request(app).get('/jobs/3');
  expect(result.statusCode).toEqual(404)
  expect(result.body).toEqual({"error": {"message": "No jobs found with id of 3", "status": 404}})
})


test("Get job w/ title filter", async function(){
  let result = await request(app).get('/jobs?title=test_title3')
  expect(result.body).toEqual(
    {
    jobs: [
      {
        title: 'test_title3',
        salary: 30000,
        equity: '0',
        company_handle: 'c3',
        name: 'C3',
      },

      {
        "title" : "test_title3",
        "salary" : 100000,
        "equity" : "0.8",
        "company_handle" : "c1",
        "name" : "C1"
      }
    ]
  })
})

test("GET job w/ filter, ERROR, no results found", async function(){
  let result = await request(app).get('/jobs?salary=5000000');
  expect(result.statusCode).toEqual(404)
  expect(result.body).toEqual({"error": {
    "message": "No jobs found with matching filters",
    "status": 404
}}
)
})

test("Get job w/ salary", async function(){
  let result = await request(app).get('/jobs?salary=20000')
  expect(result.body).toEqual(
    {
    jobs: [

      {
        "title" : "test_title2",
        "salary": 20000,
        "equity" : "0",
        "company_handle" : "c2",
        "name": "C2"

      },
      {
        title: 'test_title3',
        salary: 30000,
        equity: '0',
        company_handle: 'c3',
        name: 'C3',
      },
      {
        "title" : "test_title3",
        "salary" : 100000,
        "equity" : "0.8",
        "company_handle" : "c1",
        "name" : "C1"
      }
    ]
  })
})

/* 
*/
test('GET job with equity=true', async function(){
  let result = await request(app).get('/jobs?equity=true')
  expect(result.body).toEqual(
    {
      jobs: [
        {
          title: 'test_title1',
          salary: 10000,
          equity: '0',
          company_handle: 'c1',
          name: 'C1'
        },
        {
          title: 'test_title2',
          salary: 20000,
          equity: '0',
          company_handle: 'c2',
          name: 'C2'
        },
        {
          title: 'test_title3',
          salary: 30000,
          equity: '0',
          company_handle: 'c3',
          name: 'C3'
        },
        {
          "title" : "test_title3",
          "salary" : 100000,
          "equity" : "0.8",
          "company_handle" : "c1",
          "name" : "C1"
        }
        
      ]
    }
  )
})

test("GET w/ filter: title,salary", async function(){
  let result = await request(app).get('/jobs?title=test_title3&salary=50000');
  expect(result.body).toEqual(
    {
    jobs:
    [{
      "title" : "test_title3",
      "salary" : 100000,
      "equity" : "0.8",
      "company_handle" : "c1",
      "name" : "C1"
    }]
  }
  )
})

})

/**
 * does not work when I try to create a test job inside of the function below??
 */
describe("test /POST", function(){
  test('/post with isAdmin', async function(){
    // console.log(newJob)
    const result = await request(app).post('/jobs')
    .send(newJob)
    .set("authorization", `Bearer ${u1Token}`);
// console.log(result.body)
// console.log(newJob)
  })
 
  test("/post with isAdmin = false", async function(){
const result = await request(app).post('/jobs').send(newJob)
expect(result.body).toEqual({ error: { message: 'Unauthorized', status: 401 } })
  })
})

  describe("test /delete", function(){
  test('/:id delete id does not exist', async function(){
    
    const result = await request(app).delete('/jobs/1').set("authorization", `Bearer ${u1Token}`);
    expect(result.statusCode).toEqual(404);
    expect(result.body).toEqual({ error: { message: 'Job with id of 1 does not exist.', status: 404 } })
  
})
})
  

// describe("update", function () {
//   let updateData = {
//     title: "New",
//     salary: 500,
//     equity: "0.5",
//   };
//   test("works", async function () {
//     let job = await Jobs.update(3, updateData);
//     expect(job).toEqual({
//       id: 3,
//       companyHandle: "c1",
//       ...updateData,})
//     })
//     })
