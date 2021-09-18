// 定义常量
const PENDING_STATE = "pending";
const FULFILLED_STATE = "fulfilled";
const REJECT_STATE = "reject";

const isObject = (value) => {
  return value && typeof value === "object";
};

const isFunction = (fun) => {
  return fun && typeof fun === "function";
};

// 定义promise构造函数
function Promise(fun) {
  // 1. 基本的判断
  // 1.1 判断是否是通过new调用
  if (!this || this.constructor !== Promise) {
    throw new TypeError("Promise must be called with new");
  }
  // 1.2 判断参数fun是否是一个函数
  if (!isFunction(fun)) {
    throw new TypeError("Promise constructor's argument must be a function");
  }
  //定义初始状态
  this.state = PENDING_STATE;
  this.value = void 0;

  // 定义回调函数队列
  this.onFulfilledCallbacks = [];
  this.onRejectedCallbacks = [];

  //定义resolve函数
  const resolve = (value) => {
    resolveFuncion(this, value);
  };

  const resolveFuncion = function (promise, x) {
    if (x === promise) {
      return reject(new TypeError("Promise can not resolved with itself"));
    }

    if (x instanceof Promise) {
      return x.then(resolve, reject);
    }

    if (isFunction(x) || isObject(x)) {
      let called = false;
      try {
        let then = x.then;
        if (isFunction(then)) {
          then.call(
            x,
            (y) => {
              if (called) {
                return;
              }
              called = true;
              resolveFuncion(promise, y);
            },
            (error) => {
              if (called) {
                return;
              }
              called = true;
              reject(error);
            }
          );
          return;
        }
      } catch (error) {
        if (called) {
          return;
        }
        called = true;
        reject(error);
      }
    }

    if (promise.state === PENDING_STATE) {
      promise.state = FULFILLED_STATE;
      promise.value = x;
    }

    promise.onFulfilledCallbacks.forEach((callback) => callback());
  };

  // 定义reject函数
  const reject = (reason) => {
    if (this.state === PENDING_STATE) {
      this.state = REJECT_STATE;
      this.value = reason;
      this.onRejectedCallbacks.forEach((callback) => callback());
    }
  };

  // 定义run函数
  try {
    fun(resolve, reject);
  } catch (error) {
    reject(error);
  }
}

Promise.prototype.then = function (onFulfilled, onReject) {
  onFulfilled = isFunction(onFulfilled) ? onFulfilled : (value) => value;
  onReject = isFunction(onReject)
    ? onReject
    : (error) => {
        throw error;
      };
  return new Promise((resolve, reject) => {
    let wrapOnFulfilled = () => {
      setTimeout(() => {
        try {
          let x = onFulfilled(this.value);
          resolve(x);
        } catch (error) {
          reject(error);
        }
      }, 0);
    };

    let wrapOnRejected = () => {
      setTimeout(() => {
        try {
          let x = onReject(this.value);
          resolve(x);
        } catch (error) {
          reject(error);
        }
      }, 0);
    };

    if (this.state === FULFILLED_STATE) {
      wrapOnFulfilled();
    } else if (this.state === REJECT_STATE) {
      wrapOnRejected();
    } else {
      this.onFulfilledCallbacks.push(wrapOnFulfilled);
      this.onRejectedCallbacks.push(wrapOnRejected);
    }
  });
};

// 如果Promise.resolve接收到的是一个promise，则会直接返回这个promise；否则，则会进一步执行决议操作。
Promise.resolve = function (value) {
  return value instanceof Promise
    ? value
    : new Promise((resolve) => resolve(value));
};

// Promise.reject无论接收到什么，都会直接以接收到的值作为拒绝理由，而不会像resolve一样进行拆解。
Promise.reject = function (reason) {
  return new Promise((resolve, reject) => reject(reason));
};

module.exports = Promise;
