const compose = require("..");

async function add1(context, next) {
  console.log("add1 satrt...");
  next(1);
  console.log("add1 end...");
}

async function add2(context, next) {
  console.log("add2 start...");
  next(2);
  console.log("add2 end");
}

async function add3(context, next) {
  console.log("add3 start...");
  context.count = 3;
  next(3);
  console.log("add3 end");
}

const stack = [add1, add2, add3];
compose(stack)({ count: 0, age: 1 }, (n) => {
  console.log("call next", n);
});

// add1 => add2 => add3
