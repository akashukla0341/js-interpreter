import React from 'react';
import EventLoop from './components/EventLoop';
import './App.css'


const App = () => {
 

//   const codeString = `$.on('button', 'click', function onClick() {
//     setTimeout(function timer() {
//         console.log('You clicked the button!');    
//     }, 2000);
// });&

// console.log("Hi!");&

// setTimeout(function timeout() {
//     console.log("Click the button!");
// }, 5000);&

// console.log("Welcome to loupe.");`;

// Remove line breaks and split by semicolons to create a single array
// const codeArray = codeString.split('&');

// // Display the resulting array
// console.log(codeArray);




  return (
    <>
       <div style={{backgroundColor:"#374151",color:"white", marginBottom:"10px",marginTop:"5px"}} className='p-3 brand'>⚒ JS-INT</div>
       <EventLoop />
     
    </>
  );
}

export default App;
