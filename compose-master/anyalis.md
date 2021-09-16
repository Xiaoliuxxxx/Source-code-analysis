## koa-compose 用法

```js
async function add1(context, next) {
  console.log("add1 satrt...");
  next();
  console.log("add1 end...");
}

async function add2(context, next) {
  console.log("add2 start...");
  next();
  console.log("add2 end");
}

const stack = [add1, add2];
compose(stack)();
```

## 整体结构

- 1.传入函数数组 middleware
  - 1.1 middleware 必须得是一个数组
  - 1.2 middleware 中的每一项必须是函数
  - 1.3 返回一个函数

```js
function compose(middleware) {
  // 1.1.middleware必须得是一个数组
  if (!Array.isArray(middleware))
    throw new TypeError("Middleware stack must be an array!");
  for (const fn of middleware) {
    // 1.2.middleware中的每一项必须是函数
    if (typeof fn !== "function")
      throw new TypeError("Middleware must be composed of functions!");
  }
  // 1.3.返回一个函数
  return function (context, next) {
    let index = -1;
    return dispatch(0);
    function dispatch(i) {
      // ...
    }
  };
}
```
