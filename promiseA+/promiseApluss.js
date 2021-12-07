/**
 * 基于promise A+规范实现的Promise
 */

// promise的三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";
/**
 *  传入一个执行器（函数）
 *  函数必须有2个参数resolve,reject
 *  这两个参数就是promise中定义的resolve,reject
 *
 * @param {Function} excutor
 */
function PromiseA(excutor) {
  let _this = this;
  this.status = PENDING; //初始状态为pending
  this.value = undefined; //fulfilled状态时返回的信息
  this.reason = undefined; //rejected拒绝时返回的原因
  this.onFulfilledCallbacks = []; //用于存放fulfilled的对应的回调,即then的第一个参数
  this.onRejectedCallbacks = []; //用于存放rejected的对应回调，即then的第二个参数

  // 定义成功方法
  function resolve(value) {
    if (value instanceof PromiseA) {
      return value.then(resolve, reject);
    }

    setTimeout(() => {
      if (_this.status === PENDING) {
        _this.status = FULFILLED;
        _this.value = value;
        _this.onFulfilledCallbacks.forEach((cb) => cb(_this.value));
      }
    });
  }

  //定义拒绝的方法
  function reject(reason) {
    setTimeout(() => {
      if (_this.status === PENDING) {
        _this.status = REJECTED;
        _this.reason = reason;
        _this.onRejectedCallbacks.forEach((cb) => cb(_this.reason));
      }
    });
  }

  // 捕获执行器抛出的异常在catch中reject
  try {
    excutor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

/**
 * 收集成功的回调和失败的回调
 * @param {Function} onFulfilled
 * @param {Function} onReject
 * @return {PromiseA} 返回一个新的promise
 */
PromiseA.prototype.then = function (onFulfilled, onRejected) {
  let _this = this;
  let newPromise; //返回新的promise

  // 预处理 保证是一个函数
  onFulfilled =
    typeof onFulfilled === "function" ? onFulfilled : (value) => value;
  onRejected =
    typeof onRejected === "function"
      ? onRejected
      : (reason) => {
          throw reason;
        };

  /**
   * 由于then方法可以调用多次，所以在任何状态下都可能调用then
   * 那么需要分3种情况讨论PENDING  FULFILLED  REJECTED
   */

  if (_this.status === FULFILLED) {
    return (newPromise = new PromiseA((resolve, reject) => {
      setTimeout(() => {
        try {
          // 将value作为参数去执行成功的回调
          let x = onFulfilled(_this.value);
          // 因为拿到的值不确定，所以需要去解决一下
          resolvePromise(newPromise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    }));

    //返回新的promise
    return newPromise;
  }

  if (_this.status === REJECTED) {
    newPromise = new PromiseA((resolve, reject) => {
      setTimeout(() => {
        try {
          let x = onRejected(_this.reason);
          resolvePromise(newPromise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    });

    return newPromise;
  }

  if (_this.status === PENDING) {
    // 当异步调用resolve/rejected时 将onFulfilled/onRejected收集暂存到集合中
    newPromise = new PromiseA((resolve, reject) => {
      _this.onFulfilledCallbacks.push((value) => {
        try {
          let x = onFulfilled(value);
          resolvePromise(newPromise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });

      _this.onRejectedCallbacks.push((reason) => {
        try {
          let x = onRejected(reason);
          resolvePromise(newPromise, x, resolve, reject);
        } catch (e) {
          reject(e);
        }
      });
    });
    return newPromise;
  }
};

/**
 * 针对x不同类型进行处理
 * 1.普通值
 * 2.promise对象
 * 3.then函数/对象
 * @param {PromiseA} promise2
 * @param {*} x
 * @param {Function} resolve
 * @param {Function} reject
 * @return {PromiseA}
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 如果返回就是promise2那么就会造成循环引用
  if (promise2 === x) {
    return reject(new TypeError("循环引用"));
  }

  let called = false; //避免多次调用

  if (x instanceof PromiseA) {
    // 如果x是promise对象的话
    if (x.status === PENDING) {
      x.then(
        (y) => {
          resolvePromise(promise2, y, resolve, reject);
        },
        (reason) => {
          reject(reason);
        }
      );
    } else {
      x.then(resolve, reject);
    }
  } else if (x !== null && (typeof x === "object" || typeof x === "function")) {
    // x为对象或者函数
    try {
      let then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            resolvePromise(promise2, y, resolve, reject);
          },
          (reason) => {
            if (called) return;
            called = true;
            reject(reason);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      // 说明是一个普通的函数或者对象
      reject(e);
    }
  } else {
    resolve(x);
  }
}

/**
 * PromiseA.all Promise进行并行处理
 * 参数: promise对象组成的数组作为参数
 * 返回值: 返回一个Promise实例
 * 当这个数组里的所有promise对象全部变为resolve状态的时候，才会resolve。
 */
PromiseA.all = function (promises) {
  return new PromiseA((resolve, reject) => {
    let done = gen(promises.length, resolve);
    promises.forEach((promise, index) => {
      promise.then((value) => {
        done(index, value);
      }, reject);
    });
  });
};

function gen(length, resolve) {
  let count = 0;
  let values = [];
  return function (i, value) {
    values[i] = value;
    if (++count === length) {
      console.log(values);
      resolve(values);
    }
  };
}

/**
 * PromiseA.race
 * 参数: 接收 promise对象组成的数组作为参数
 * 返回值: 返回一个Promise实例
 * 只要有一个promise对象进入 FulFilled 或者 Rejected 状态的话，就会继续进行后面的处理(取决于哪一个更快)
 */
PromiseA.race = function (promises) {
  return new PromiseA((resolve, reject) => {
    promises.forEach((promise, index) => {
      promise.then(resolve, reject);
    });
  });
};

// 用于promise方法链时 捕获前面onFulfilled/onRejected抛出的异常
PromiseA.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
};

PromiseA.resolve = function (value) {
  return new PromiseA((resolve) => {
    resolve(value);
  });
};

PromiseA.reject = function (reason) {
  return new PromiseA((resolve, reject) => {
    reject(reason);
  });
};

PromiseA.deferred = function () {
  // 延迟对象
  let defer = {};
  defer.promise = new PromiseA((resolve, reject) => {
    defer.resolve = resolve;
    defer.reject = reject;
  });
  return defer;
};

/**
 * PromiseA/A+规范测试
 * npm i -g promises-aplus-tests
 * promises-aplus-tests PromiseA.js
 */

try {
  module.exports = PromiseA;
} catch (e) {}
