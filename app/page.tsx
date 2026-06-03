import axios from "axios";
import {productsApi} from "@/lib/axios/productsServices";
export default async function Home() {
 
  const products = await productsApi.getProducts()
  console.log(products)
  
  return (
    <div>
      home funziona
    </div>
  );
}
