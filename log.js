/**
 * @param {*} name
 * @param {*} data
 */
const log = (name, data = null) => {
  console.log('----------');

  if (data !== null) {
    console.log(`${name}:`);
    console.log(data);
  } else {
    console.log(name);
  }
};

export default log;
