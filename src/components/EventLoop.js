import React, { useState, useEffect, useRef } from "react";
import "./EventLoop.css";
import * as acorn from "acorn";
import { simple as walkSimple } from "acorn-walk";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import XLVILoader from "./XLVILoader";

const EventLoop = () => {
  const [data, setData] = useState("");
  const [asyncOperations, setAsyncOperations] = useState([]);
  const [allOperations, setAllOperations] = useState([]);
  const [renderedElements, setRenderedElements] = useState([]);
  const [render, setRenders] = useState([]);
  const [microReverse, setMicroReverse] = useState([]);
  const [callbackReverse, setCallbackReverse] = useState([]);
  const [allcallBack, setallCallback] = useState([]);
  const [allmicrotask, setallMicrotask] = useState([]);
  const [loader, setLoader] = useState(false);

  const textAreaRef = useRef(null);

  const handleChange = (event) => {
    setData(event.target.value);
  };

  function allFunctionality(data, setter, type) {
    if (type === "all") {
      const renderTimeouts = data.map((val, i) => {
        const timeoutId = setTimeout(() => {
          setter((prevState) => [...prevState, val]);
          setTimeout(() => {
            setter((prevState) => prevState.filter((item) => item !== val));
          }, 1000);
        }, i * 1000);
        return timeoutId;
      });
      return () => {
        renderTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        setRenderedElements([]);
      };
    } else {
      const renderTimeouts = data.map((val, i) => {
        val.map((ele) => {
          const timeoutId = setTimeout(() => {
            setter((prevState) => [...prevState, ele]);
            setTimeout(() => {
              if (ele.type === "fetch" || ele.type === "promise") {
                setallMicrotask((prevState) => [...prevState, ele]);
                setLoader(true);
                setTimeout(() => {
                  setMicroReverse([ele]);
                  setTimeout(() => {
                    setLoader(false);
                    setTimeout(() => {
                      setMicroReverse([]);
                    }, 1000);
                    setallMicrotask([]);
                  }, 2000);
                }, 5000);
              } else if (
                ele.type === "timer/event" ||
                ele.type === "event listener"
              ) {
                setallCallback((prevState) => [...prevState, ele]);
                setLoader(true);
                setTimeout(() => {
                  setCallbackReverse([ele]);
                  setTimeout(() => {
                    setLoader(false);
                    setTimeout(() => {
                      setCallbackReverse([]);
                    }, 1000);
                    setallCallback([]);
                  }, 2000);
                }, 5000);
              }
              setter((prevState) => prevState.filter((item) => item !== ele));
            }, ele.timeout);
          }, 1000);
          return timeoutId;
        });
        return () => {
          renderTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
        };
      });
    }
  }

  useEffect(() => {
    let uniqueSet = new Set(allOperations.map(JSON.stringify));
    let uniqueArray = Array.from(uniqueSet).map(JSON.parse);
    return allFunctionality(uniqueArray, setRenderedElements, "all");
  }, [allOperations]);

  useEffect(() => {
    let uniqueSet = new Set(asyncOperations.map(JSON.stringify));
    let uniqueArray = Array.from(uniqueSet).map(JSON.parse);
    return allFunctionality(uniqueArray, setRenders, "async");
  }, [asyncOperations]);

  function recursiveFunction(arr, index) {
    if (arr.length === 0) {
      return;
    }
    let asyncOperater = validateAsyncOperations(arr[index]);
    setAllOperations((prevState) => [...prevState, asyncOperater]);
    if (asyncOperater[0].type !== "synchronous") {
      setAsyncOperations((prevState) => [...prevState, asyncOperater]);
    }

    index = index + 1;
    if (index < arr.length) {
      recursiveFunction(arr, index);
    }
  }

  const handleEditClick = () => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const handleClick = () => {
    if (data.trim() !== "") {
      setallCallback([]);
      setallMicrotask([]);
      setAllOperations([]);
      const code = data.split("endl");
      const filteredArr = code.filter((item) => item.trim() !== "");
      recursiveFunction(filteredArr, 0);
    } else {
      toast.error("Write some code in Text area...");
    }
  };

  function validateAsyncOperations(code) {
    try {
      const ast = acorn.parse(code, { ecmaVersion: 2020 });
      let asyncOperations = [];

      walkSimple(ast, {
        FunctionDeclaration(node) {
          if (node.async) {
            asyncOperations.push({
              type: "async function",
              name: node.id ? node.id.name : "anonymous",
              code: code,
              timeout: 1000,
            });
          }
        },
        CallExpression(node) {
          if (
            node.callee.type === "Identifier" &&
            (node.callee.name === "setTimeout" ||
              node.callee.name === "setInterval" ||
              node.callee.name === "addEventListener")
          ) {
            const timeoutArgument = node.arguments[1];
            if (timeoutArgument && timeoutArgument.type === "Literal") {
              asyncOperations.push({
                type: "timer/event",
                code: code,
                name: node.callee.name,
                timeout: timeoutArgument.value,
              });
            }
          }
        },
        NewExpression(node) {
          if (node.callee.name === "Promise") {
            asyncOperations.push({
              type: "promise",
              name: "Promise",
              code: code,
              timeout: 1000,
            });
          }
        },
        Property(node) {
          if (
            node.key.type === "Identifier" &&
            node.key.name === "addEventListener"
          ) {
            asyncOperations.push({
              type: "event listener",
              code: code,
              name: "addEventListener",
              timeout: 1000,
            });
          }
        },
        MemberExpression(node) {
          if (
            node.object.type === "CallExpression" &&
            node.object.callee.name === "fetch"
          ) {
            asyncOperations.push({
              type: "fetch",
              name: "fetch API",
              code: code,
              timeout: 1000,
            });
          }
          if (
            node.property.type === "Identifier" &&
            node.property.name === "addEventListener"
          ) {
            asyncOperations.push({
              type: "event listener",
              code: code,
              name: "addEventListener",
              timeout: 1000,
            });
          }
        },
      });

      if (asyncOperations.length === 0) {
        asyncOperations.push({
          type: "synchronous",
          code: code,
          name: "synchronous",
          timeout: 1000,
        });
        return asyncOperations;
      } else {
        return asyncOperations;
      }
    } catch (error) {
      console.error("Error parsing code:", error);
      return [];
    }
  }

  return (
    <div className="container-fluid">
      <div className="row" style={{ marginBottom: "30px" }}>
        <div className="col-lg-4 col-md-4 col-12">
          <div className="row">
            {/* for button save and run */}
            <div className="col-lg-12 col-md-12 col-12 mb-4 d-grid gap-2 d-md-flex justify-content-md-end">
              <div>
              <button class="boton-elegante" onClick={handleClick}>
                Save & Run
              </button>

              <button className="Btn" onClick={handleEditClick}>
                Edit
                <svg className="svg" viewBox="0 0 512 512">
                  <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                </svg>
              </button>
              </div>
              <div
                class="alert alert-warning alert-dismissible fade show mt-3"
                role="alert"
              >
                "Please add <strong>endl</strong> after every statement."
                
              </div>
            </div>
            {/* code for text. */}
            <div className="col-lg-12 col-md-12 col-12">
              <textarea
                className="form-control shadow-none"
                rows={17}
                ref={textAreaRef}
                style={{ overflow: "auto", resize: "none" }}
                placeholder="Write your synchronous or asynchronous js code here....."
                onChange={handleChange}
              ></textarea>
            </div>
            {/* console API */}
            <div className="col-lg-12 col-md-12 col-12 mt-3">
              {/* {loader ? <XLVILoader /> : ""} */}
            </div>
          </div>
        </div>
        <div className="col-lg-8 col-md-8 col-12">
          <div className="row">
            <div className="col-lg-4 col-md-4 col-12">
              <div className="callStack">
                <label className="form-label text-secondary p-2">
                  Call Stack
                </label>
                <div className="p-2" id="callStack">
                  {renderedElements.map((val, i) =>
                    val.map((el, j) => (
                      <div
                        key={j}
                        style={{
                          border: "2px solid gray",
                          color: "white",
                          padding: "10px",
                        }}
                      >
                        {el.code.slice(0, 100)}
                      </div>
                    ))
                  )}
                  {microReverse.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid gray",
                        color: "white",
                        padding: "10px",
                      }}
                    >
                      {val.code}
                    </div>
                  ))}
                  {callbackReverse.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid gray",
                        color: "white",
                        padding: "10px",
                      }}
                    >
                      {val.code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-8 col-md-8 col-12">
              <div className="webApi">
                <label className="form-label text-secondary p-2">
                  Web APIs
                </label>
                <div className="p-2" id="webApi">
                  {render.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid gray",
                        color: "white",
                        padding: "10px",
                      }}
                    >
                      {val.code.slice(0, 100)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Event Loop */}
          <div className="row mt-3">
            <div className="col-lg-12 col-md-12 col-12">
            {loader ? <XLVILoader /> : ""}
            </div>
          </div>
          {/* Callback Queue */}
          <div className="row mt-3">
            <div className="col-lg-6 col-md-6 col-12">
              <div className="callBackQueue">
                <label className="form-label text-secondary p-2">
                  CallBack Queue
                </label>
                <div className="p-2" id="callBackQueue">
                  {allcallBack.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid gray",
                        color: "white",
                        padding: "10px",
                      }}
                    >
                      {val.code.slice(0, 100)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="col-lg-6 col-md-6 col-12">
              <div className="microTaskQueue">
                <label className="form-label text-secondary p-2">
                  MicroTask Queue
                </label>
                <div className="p-2" id="microTaskQueue">
                  {allmicrotask.map((val, i) => (
                    <div
                      key={i}
                      style={{
                        border: "2px solid gray",
                        color: "white",
                        padding: "10px",
                      }}
                    >
                      {val.code.slice(0, 100)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default EventLoop;
