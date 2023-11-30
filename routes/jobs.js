const express = require('express');
const Jobs = require('../models/jobs');
const router = new express.Router()
const  {ensureLoggedIn, ensureIsAdmin,} = require('../middleware/auth');
const { NotFoundError, BadRequestError } = require('../expressError');
const jobCreate = require('../schemas/jobCreate.json')
const jsonschema = require('jsonschema');


router.get('/', async function(req,res,next){
    const query = req.query;
    if (query.salary !== undefined) query.salary = +query.salary;
    query.equity = query.quity === "true";
    try{
    const jobs = await Jobs.findAll(query)
    if(jobs.length === 0){
        throw new NotFoundError(`No jobs found with matching filters`)
    }
    return res.json({jobs})
    } catch(e){
        return next(e)
    }
})

router.get('/:id', async function(req,res,next){
    const {id} = req.params;
    try{
        let result = await Jobs.get(id)

        if(result.rows.length === 0){
            throw new NotFoundError(`Job with id of ${id} does not exist`)
        }
        return res.json({result})
    }

    catch(e){
return next(e)
    }
})

router.post('/', ensureLoggedIn, ensureIsAdmin, async function(req,res,next){
    const {title,salary,equity,company_handle} = req.body;

    try{
    const validator = jsonschema.validate(req.body, jobCreate)

    if(!validator.valid){
        const error = validator.errors.map(e => e.stack)
        throw new BadRequestError(error)
    }
    let result = await Jobs.post(title,salary,equity,company_handle)
    return res.json({"New job successfully posted" : {result}})
    }

    catch(e){
        return next(e)
    }
})

router.delete('/:id', ensureLoggedIn, ensureIsAdmin, async function(req,res,next){
    const id = req.params.id;
   
    try{
        let result = await Jobs.remove(id);
        if(!result){
            throw new NotFoundError(`Job with id of ${id} does not exist`)
        }

        return res.json(`Job with id of ${id} has successfully been deleted`)
    }
    catch(e){
        return next(e)
    }
})

router.patch('/:id', ensureLoggedIn,ensureIsAdmin, async function(req,res,next){
    const id = req.params.id;
    try{    
        const validator = jsonschema.validate(req.body, jobCreate)
        if(!validator.valid){
            const errors = validator.errors.map(e => e.stack)
            throw new BadRequestError(errors)
        }
        const result = await Jobs.update(id, req.body)
        return res.json({result})
    }

    catch(e){
        return next(e)
    }
})

module.exports = router;