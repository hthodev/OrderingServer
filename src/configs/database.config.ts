import * as dotenv from "dotenv";
dotenv.config()

export default () => ({
  database: {
    uri: process.env.MONGODB_URI,
  },
});
