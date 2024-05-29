import Product from "../models/Product.js";
import ProductStat from "../models/ProductStat.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import getCountryIso3 from "country-iso-2-to-3";

export const getProducts = async (req, res) => {
    try {
      const products = await Product.find();
  
      const productsWithStats = await Promise.all(
        products.map(async (product) => {
          const stat = await ProductStat.find({
            productId: product._id,
          });
          return {
            ...product._doc,
            stat,
          };
        })
      );
      
      // 200 represents done（the status code is set to 200, indicating a successful request.）, 
      // prompts the objects of"productsWithStat" to the format of JSON（converts a JavaScript object or array into JSON format and sends it as the response body）
      res.status(200).json(productsWithStats);
    } catch (error) {
      // sets the response status code. In this case, the status code is set to 404, indicating that the requested resource was not found.
      // converts an object containing the error message into JSON format and sends it as the response body.
      res.status(404).json({ message: error.message });
    }
  };

  export const getCustomers = async (req, res) => {
    try {
      const customers = await User.find({ role: "user"}).select("-password");
      res.status(200).json(customers);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };

  //what user requested on the frontend
  export const getTransactions = async (req, res) => {
    try {
      // sort should look like this: { "field": "userId", "sort": "desc"}
      const { page = 1, pageSize = 20, sort = null, search = "" } = req.query;
  
      // formatted sort should look like { userId: -1 }
      const generateSort = () => {
        const sortParsed = JSON.parse(sort);
        const sortFormatted = {
          [sortParsed.field]: (sortParsed.sort = "asc" ? 1 : -1),
        };
  
        return sortFormatted;
      };
      const sortFormatted = Boolean(sort) ? generateSort() : {};
  
      const transactions = await Transaction.find({
        $or: [
          //only search these two columns
          //price check: do a search
          { cost: { $regex: new RegExp(search, "i") } },
          { userId: { $regex: new RegExp(search, "i") } },
        ],
      })
        .sort(sortFormatted)
        .skip(page * pageSize)
        .limit(pageSize);
  
        //the number of documents that exist in the MongoDB
        const total = await Transaction.countDocuments({
        name: { $regex: search, $options: "i" },
      });
  
      res.status(200).json({
        transactions,
        total,
      });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  };

  export const getGeography = async(req, res) => {
    try{
      const users = await User.find();

      const mappedLocations = users.reduce((acc, { country }) => {
        // convert the country format that we need
        const countryISO3 = getCountryIso3(country);
        if(!acc[countryISO3]){
          acc[countryISO3] = 0;
        }
        acc[countryISO3]++;
        return acc;
      }, {

      });

      const formattedLocations = Object.entries(mappedLocations).map(
        ([country, count]) => {
          return { id: country, value: count }
        }
      );

      res.status(200).json(formattedLocations);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }