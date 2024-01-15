import React from "react";
import Navbar from "../components/Navbar";
import Transactions from "../components/Transactions";

const Home = () => {
  return (
    <div className="">
      <Navbar />
      <div className='md:px-20'>
        <Transactions />
      </div>
    </div>
  );
};

export default Home;
