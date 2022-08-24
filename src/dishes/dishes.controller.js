const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

//Utils
const nextId = require("../utils/nextId");
const bodyDataHas = require("../utils/bodyDataHas");

//validator functions

function dishExists(req, res, next){
    const {dishId} = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish; 
        return next();
    }

    next({status: 404, message: `Dish id not found: ${dishId}`});
}


function idPropertyIsValid(req, res, next){
    const { data: {id} = {} } = req.body;
    const {dishId} = req.params;
    if(id && dishId !== id){
        next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});
    }
    return next();
    
}

function pricePropertyIsValid(req, res, next){
    const { data: {price} = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)) {
        next({ status: 400, message: "Dish must have a price that is an integer greater than 0"});
    }

    return next();
}

//list all dishes
function list(req, res, next) {
    res.json({data: dishes});
}

//read dish by dishId
function read(req, res, next) {
    res.json({data: res.locals.dish});
}

//create new dish
function create(req, res, next) {
    const { data: {name, description, price, image_url} = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    } 

    dishes.push(newDish)
    res.status(201).json({data: newDish});
}

//Update existing dish
function update(req, res, next) {
    const dish = res.locals.dish;
    const {data: {name, description, price, image_url}} = req.body;

    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    
    res.json({data: dish });
}


module.exports = {
    dishExists,
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        pricePropertyIsValid,
        idPropertyIsValid,
        update
    ],
}