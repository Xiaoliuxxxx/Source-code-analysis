"use strict";

/**
 * Expose compositor.
 */

module.exports = compose;

/**
 * Compose `middleware` returning
 * a fully valid middleware comprised
 * of all those which are passed.
 *
 * @param {Array} middleware 1.参数是函数组成的数组
 * @return {Function} 2.返回的是一个函数
 * @api public
 */

function compose(middleware) {
  // 1.1.middleware必须得是一个数组
  if (!Array.isArray(middleware))
    throw new TypeError("Middleware stack must be an array!");
  for (const fn of middleware) {
    // 1.2.middleware中的每一项必须是函数
    if (typeof fn !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }

  /**
   * @param {Object} context
   * @return {Promise}
   * @api public
   */

  return function (context, next) {
    // last called middleware #
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      if (i <= index)
        return Promise.reject(new Error("next() called multiple times"));
      index = i;
      let fn = middleware[i];
      // i=== middleware.length 表示所有的middleware都遍历完成
      if (i === middleware.length) fn = next;
      // 如果fn不存在，那么直接resolve
      if (!fn) return Promise.resolve();
      try {
        // next的实参  dispatch.bind(null, i + 1)
        return Promise.resolve(fn(context, dispatch.bind(null, i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }
  };
}
