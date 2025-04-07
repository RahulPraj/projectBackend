const express = require('express');
const app = express();
const mongoose = require('mongoose');
const {User} = require('./model/User');
const morgan = require('morgan');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {Product} = require('./model/Product');

//middleware
app.use(cors());
app.use(morgan('dev'))
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/rahulEcomm')
.then(()=>{
    console.log("db is connected")
}).catch((error)=>{
    console.log("db is not connectd", error)
})

//task-1 create route for register user
app.post('/register',async(req,res)=>{
    try{
        let {name, email,password} = req.body;

        //check if any field missingt
        if(!email || !name || !password){
            res.status(400).json({
                message:"Field is missing"
            })
        }
        //check if user allready have account
        const user = await User.findOne({email});

        if(user){
            return res.status(400).json({
                message: "User already has a account"
            })
        }else{

            //hash the password ->  secure password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password,salt);

            //user authentication
            const token = jwt.sign({email},"supersecret",{expiresIn:'365d'});

            //create user in database
            await User.create({
                name,
                password : hashedPassword,
                email,
                token,
                role:'user'
            })

            return res.status(200).json({
                message: "User created successfully"
            })
        }

    }catch(error){
        console.log(error);
        res.status(400).json({
            message:"Internal server error"
        })
    }
})

//task-2 create route for login
app.post('/login',async(req,res)=>{
    try{
        let {email,password} = req.body;

        //check all fields are there or not
        if(!email || !password){
            return res.status(400).json({
                message: "Field is missing"
            })
        }
        //checking user having account
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({
                message: "User not Registered"
            })
        }
        //campare password with the stored password
        const isPasswordMatched = bcrypt.compareSync(password, user.password)

        if(!isPasswordMatched){
            return res.status(404).json({
              message: "Password is wrong"  
            })
        }

        return res.status(200).json({
           message:"User loged in successfully",
            id: user._id,
            name: user.name,
            token: user.token,
            email : user.email,
            role : user.role
        })
    }catch(error){
        console.log(error);
        res.status(400).json({
            message:"Internal server error"
        })
    }
})

//task-3 create route to see all product
app.get('/products',async(req,res)=>{
    try{
        
        const products = await Product.find();
        res.status(200).json({
            message: "Product found seccussfully",
            products:products
        })
    }catch(error){
        console.log(error);
        res.status(400).json({
            message:"Internal server error"
        })
    }
})

//task-4 create route to add product
app.post('/add-product',async(req,res)=>{
    try{
            let {name, image, description, stock, brand, price}=req.body;
            const {token} = req.headers;
            const decodedToken = jwt.verify(token, "supersecret");
            const user =  await User.findOne({email: decodedToken.email})
            const product = await Product.create({
                name,
                stock, 
                price, 
                image,
                description,
                brand,
                user: user._id
            })
            return res.status(200).json({
                message: "Product created successfully",
                product:product
            })
    }catch(error){
        console.log(error);
        res.status(400).json({
            message:"Internal server error"
        })
    }
})

//task-5 create route to see particular product
app.get('/product/:id',async(req,res)=>{
    try{
        let {id} = req.params;
        if(!id){
            return res.status(400).json({
                message: "Product id not found"
            })
        }
        let {token} = req.headers;
        const decodedToken = jwt.verify(token, "supersecret");
        if(decodedToken.email){
            const product = await Product.findById(id);
            if(!product){
                res.status(400).json({
                    message: "Product not found"
                })
            }
            return res.status(200).json({
                message: "Product found successfully",
                product
            })
        }

    }catch(error){
        console.log(error);
        res.status(400).json({
            message:"Internal server error"
        })
    }
})

//task-6 create route to update product
//task-6 update product
app.patch("/product/edit/:id", async (req, res) => {
    const { id } = req.params;
    const { token } = req.headers;
     const { name, description, image, price, brand, stock } = req.body.productData;
    const decodedToken = jwt.verify(token, "supersecret");
    try {
      if (decodedToken.email) {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
          name,
          description,
          image,
          price,
          brand,
          stock,
        });
        res.status(200).json({ 
        message: "Product Updated Succesfully",
         product: updatedProduct
          });
      }
    } catch (error) {
      res.status(400).json({
        message: "Internal Server Error Occured While Updating Product",
      });
    }
  });


let PORT = 8080;
app.listen(PORT,()=>{
    console.log(`server is connected to port ${PORT}`)
})