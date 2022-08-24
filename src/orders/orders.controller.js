const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

//Utils
const nextId = require("../utils/nextId");
const bodyDataHas = require("../utils/bodyDataHas");

//Validation functions
function orderExists( req, res, next){
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if(foundOrder){
        res.locals.order = foundOrder;
        return next();
    }
    next({status: 404, message: `Order id not found: ${orderId}`});
}

function dishQuantityValid(dish){
    const {quantity = 0} = dish;
    if( quantity <= 0 || !Number.isInteger(quantity)){
        return false;
    }
    
    return true;
}

function dishesPropertyIsValid(req, res, next){
    const { data: {dishes} = {} } = req.body;
    if(!Array.isArray(dishes) || dishes.length === 0 ){
        next({status: 400, message: "Order must include at least one dish"})
    }  
    dishes.forEach((dish, index) => {
        const {quantity} = dish;
        if(quantity <= 0 || !Number.isInteger(quantity)){
            next({status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0`});
        }
        
    })
    return next();
    
}

function idPropertyIsValid(req, res, next){
    const { data: {id} = {} } = req.body;
    const {orderId} = req.params;
    if(id && orderId !== id){
        next({status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`});
    }
    return next();
    
}

function statusPropertyIsValid(req, res, next){
    const { data: {status} = {} } = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"]
    if(validStatus.includes(status)){
        return next();
    }
    next({status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered"});
}

function statusIsDelivered(req, res, next){
    const { data: {status} = {} } = req.body;
    if(status === "delivered"){
        next({status: 400, message: "A delivered order cannot be changed"});
    }
    return next();
}

function statusIsPending(req, res, next){
    const {status} = res.locals.order;
    if(status === "pending"){
        return next();
    }
    next({status: 400, message: "An order cannot be deleted unless it is pending"});
}


//list all orders
function list(req, res, next){
    res.json({ data: orders });
}

//read single order by id
function read(req, res, next){
    res.json({data: res.locals.order});
}

//create new order
function create(req, res, next){
    const { data: {deliverTo, mobileNumber, dishes, status}} = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
        status,
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder});
}

//update an order
function update(req, res, next){
    const order = res.locals.order;
    const { data: {deliverTo, mobileNumber, status, dishes}} = req.body;
    
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;

    res.json({data: order});
}

//delete an order
function destroy(req, res, next){
    const {orderId} = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}


module.exports = {
    list,
    read: [orderExists, read],
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesPropertyIsValid,
        create
    ],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        idPropertyIsValid,
        dishesPropertyIsValid,
        statusPropertyIsValid,
        statusIsDelivered,
        update
    ],
    delete: [
        orderExists,
        statusIsPending,
        destroy
    ]
}