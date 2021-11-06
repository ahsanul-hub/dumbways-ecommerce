const http = require('http')
const path = require('path')
const express = require('express')
const { dirname }= require('path')
const hbs = require('hbs')
let session = require('express-session')



const app = express()

app.use(express.json())
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use(express.urlencoded({extended:false}))

app.use(
    session(
    {
        cookie :{
            maxAge: 1000 * 3600 * 2,
            secure: false,
            httpOnly: true
        },
        store : new session.MemoryStore(),
        saveUninitialized: true,
        resave: false,
        secret : 'secretKey'
    }
))

app.use((req, res, next) => {
    res.locals.message = req.session.message
    delete req.session.message
    next()
})

const dbConnection = require('./connection/db')
const {res} = require('express')

const uploadFile = require('./middleware/uploadFile')

app.set('view engine','hbs')

const isLogin = false
const userStatus = true

const pathFile = 'http://localhost:3000/uploads/'
hbs.registerPartials(__dirname + '/views/partials')

app.get('/', (req, res) => {
    const query = `select * from product`
    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
    
        conn.query(query, (err, results) =>{
            if(err) throw err

            const product = []
            for(let result of results){
                product.push({
                    id : result.id,
                    photo : pathFile + result.photo,
                    title : result.name,
                    price : result.price,
                    userstatus : (req.session.userStatus == 2)
                })
            }
            // console.log(req.session.userStatus == 2)
            res.render('index', {
            isLogin : req.session.isLogin,
            userStatus : req.session.userStatus == 2 ,
            product
        })
        })
    })
    
})

app.get('/product/:id', (req, res) => {
    var id = req.params.id
    const query =  `select * from product where id=${id}`

    

    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
    
        conn.query(query, (err, result) =>{
            if(err) throw err

            const product = {
                id : result[0].id,
                photo : pathFile + result[0].photo,
                title : result[0].name,
                stock : result[0].stock,
                description : result[0].description,
                price : result[0].price
            }
            let isOwner = false

            if (req.session.isLogin) {
                if (req.session.user.id == result[0].user_id) {
                isOwner = true
                }
            }
            console.log(product)
            
            res.render('product-detail', {
            isLogin : req.session.isLogin,
            userStatus : (req.session.userStatus == 2),
            isOwner,
            product
        })
        })
    })
})

app.get('/add-product', (req, res) => {
    res.render('add-product' , {
        isLogin : req.session.isLogin,
        userStatus : (req.session.userStatus == 2)
    })
})

app.post('/add-product', uploadFile('image'), (req, res) => {
    const {name, stock, price, description} = req.body
    const userId = req.session.user.id
    let image = ''

    if(req.file){
        image = req.file.filename
    }

    if(name == '' ||image == '' || stock == '' || price == '' || description == ''){
        req.session.message ={
            type : 'danger',
            message: 'Insert all form'
        }
    res.redirect('/add-product')
    }

    const query = `insert into product (name, stock, photo, price, description, user_id)  values ("${name}", "${stock}", "${image}", "${price}", "${description}", ${userId})`
    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
    
        conn.query(query, (err, result) =>{
            // console.log(result)
            res.redirect(`/product/${result.insertId}`)
        })
    })
})

app.get('/edit-product/:id', (req, res) => {
    const id = req.params.id

    const query = `select * from product where id = ${id}`

    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
        conn.query(query, (err, result) =>{
            // console.log(result)
            const product ={
            ... result[0],
            photo : pathFile + result[0].photo
            }
            console.log(product)
            res.render('edit-product', {
                isLogin : req.session.isLogin,
                product
               })
        })

    })

})



app.post('/edit-product/:id', uploadFile('image'), (req, res) => {
    const {name, stock, price, description} = req.body
    const userId = req.session.user.id
    const id = req.params.id
    let image = ''

    if(req.file){
        image = req.file.filename
    }

    if(name == '' ||image == '' || stock == '' || price == '' || description == ''){
        req.session.message ={
            type : 'danger',
            message: 'Insert all form'
        }
    res.redirect('/add-product')
    }

    const query = `UPDATE product SET name = "${name}", description = "${description}", photo = "${image}", price = "${price}", stock = "${stock}" where id = ${id}`
    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
    
        conn.query(query, (err, result) =>{
            console.log(result)
            res.redirect(`/product/${id}`)
        })
    })
})

app.get('/delete-product/:id', (req, res) => {
    const id = req.params.id

    const query = `delete from product where id=${id}`

    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
    
        conn.query(query, (err, result) =>{
            
            res.redirect('/')
        })
    })
})

app.get('/add-cart/:id', (req, res) => {
    const id = req.params.id
    // const {name, stock, price, description} = req.body
    // console.log(name)
    // const product ={
    //     name : res.name,
        // photo : pathFile + res[0].photo
        // }
        // console.log(product)
    // res.redirect('/cart')
    const query = `select * from product where id = ${id}`

    dbConnection.getConnection( (err, conn) => {
        if (err) throw err
        conn.query(query, (err, result) =>{
            // console.log(result)
            const product ={
            ... result[0],
            // photo : pathFile + result[0].photo
            }
            console.log(product)
            res.render('cart', {
                isLogin : req.session.isLogin,
                product
               })
        })

    })
})

app.post('/payment/:id', (req, res) => {
    const {name, price, qty} = req.body
    const userId = req.session.user.id
    const id = req.params.id
    console.log(name)

    // if(name == '' ||image == '' || stock == '' || price == '' || description == ''){
    //     req.session.message ={
    //         type : 'danger',
    //         message: 'Insert all form'
    //     }
    // res.redirect('/add-product')
    // }

    // const query = `insert into transaction (sub_total, product_id,user_id)  values (${price} * ${qty}, "${id}", ${userId})`
    // dbConnection.getConnection( (err, conn) => {
    //     if (err) throw err
    
    //     conn.query(query, (err, result) =>{
    //         console.log('berhasil')
    //         res.redirect('/')
    //     })
    // })
})


app.get('/register', (req, res) => {
    res.render('register', {
        isLogin : req.session.isLogin

    })
})

app.post('/register', (req, res) => {
   const {name , email, password, address, status} = req.body
   if ( name == '' || email =='' || password == '' || address == ''){
    // ?
    req.session.message ={
            type : 'danger',
            message: 'Insert all form'
        }
    res.redirect('/register')
   }

   const query = `insert into users (name, email, password, address, status) values ("${name}", "${email}","${password}", "${address}", ${status})`

   dbConnection.getConnection( (err, conn) => {
    if (err) throw err

    conn.query(query, (err, result) =>{
        res.redirect('/register')
    })
})
})

app.get('/login', (req, res) => {
    res.render('login', {
        isLogin : req.session.isLogin

    })
})

app.post('/login', (req, res) => {
    const {email, password} = req.body
    if (email === '' || password === ''){
    //  ?
     req.session.message ={
             type : 'danger',
             message: 'Insert all form'
         }
         console.log(req.session.message)
        res.redirect('/login')
    }
 
    const query = `select *, md5 (password) as password from users where email ="${email}" and password ="${password}"`
 
    dbConnection.getConnection( (err, conn) => {
     if (err) throw err
 
     conn.query(query, (err, result) =>{
         if(err) throw err
         
         if(result.length == 0){
            req.session.message ={
                type : 'danger',
                message: 'you account is undefined'
            }
            console.log(req.session.message)
            res.redirect('/login')
         }
         else{
            req.session.isLogin = true
            req.session.userStatus = result[0].status

            req.session.user = {
                id : result[0].id,
                name : result[0].name,
                email : result[0].email,
                status : result[0].status
            }
            res.redirect('/')
         }
         console.log(req.session.user)
            
     })
 })
 })

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})


app.get('/cart', (req, res) => {
    res.render('cart', {
        isLogin : req.session.isLogin
    })
})

const server = http.createServer(app)

app.listen(3000)
