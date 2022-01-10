let r = global['req' + 'uire'];
let xlsx   = r('node-xlsx')

addEventListener('message', event => {
  postMessage(xlsx.parse(event.data));
});