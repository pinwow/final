//各類別營收占比，共有：床架、收納、窗簾
//篩選出前三名營收品項(品項全名)，其他 4~8 名都統整為「其它」
const baseUrl = 'https://livejs-api.hexschool.io/api/livejs/v1/admin/';
const apiPath = 'finproj';
const uId = 'mUZBvasNJAciqYBadJh5l84Xs7B3';
// const today = moment(new Date()).format('yyyy/MM/DD');
const token = { 
  headers:{
    'authorization': uId,
  }
}



//dom
const tBody = document.querySelector('.orderList');
const discardAllBtn = document.querySelector('.discardAllBtn');
let orderList = [];
let chartData = [];
let chartData2 = [];

init();

/** 資料初始化, 顯示訂單列表*/
function init(){
  axios.get(`${baseUrl}${apiPath}/orders`,token)
      .then(res=>{
        orderList = res.data.orders;
        renderData();
      });
}

/** 渲染dom tree */
function renderData(){
  let orderStr = '';
  orderList.forEach(item => {
    //組產品
    let productList = item.products;
    let productStr = '';
    productList.forEach(item => {
      productStr += `<p>${item.title} x${item.quantity}</p>`;
    });

    //組訂單狀態
    let orderState = (item.paid) ? "已處理":"未處理";
    
    //組訂單日期
    //new Date要放13碼才會拿到正確日期 => new Date(13碼) =>  年月日時分秒共13碼;年月日共10碼
    let orderDate = new Date(item.createdAt*1000);// *1000 補3個零組成13碼
    let dateFormat = moment(orderDate).format('yyyy/MM/DD');

    //組訂單
    orderStr += `<tr>
                  <td>${item.id}</td>
                  <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                  </td>
                  <td>${item.user.address}</td>
                  <td>${item.user.email}</td>
                  <td>
                    ${productStr}
                  </td>
                  <td>${dateFormat}</td>
                  <td class="orderStatus">
                    <a href="#" data-id="${item.id}" data-state="${item.paid}">${orderState}</a>
                  </td>
                  <td>
                    <input type="button" class="delSingleOrder-Btn" data-id="${item.id}" value="刪除">
                  </td>
                </tr>`
  });

  tBody.innerHTML = orderStr;
  renderChart();
  
}

/** 渲染圓餅圖 */ 
function renderChart(){
  let categoryObj = {}; //分三類: categoryObj:{床架:獲利$, 收納:獲利$, 窗簾:獲利$ }
  let total = {}; // by 產品名稱
  orderList.forEach(order=>{
    let productList = order.products;
    productList.forEach(product=>{
      if(categoryObj[product.category] == undefined){
        categoryObj[product.category] = product.price * product.quantity;
      }else{
        categoryObj[product.category] = categoryObj[product.category] + product.price * product.quantity;
      }
    });

    productList.forEach(product=>{
      if(total[product.title] == undefined){
        total[product.title] = product.price * product.quantity;
      }else{
        total[product.title] = total[product.category] + product.price * product.quantity;
      }
    });
  });

  chartData = Object.entries(categoryObj);
  

  // C3.js
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
        type: "pie",
        columns: chartData,
        colors:{
            "Louvre 雙人床架":"#DACBFF",
            "Antony 雙人床架":"#9D7FEA",
            "Anty 雙人床架": "#5434A7",
            "其他": "#301E5F",
        }
    },
  });

  
  // console.log(total);
  let dataArray = Object.entries(total);
  // 依照金額由大到小排序
  dataArray.sort((a, b) => b[1] - a[1]);

  // 取出前三個
  let topThree = dataArray.slice(0, 3);

  // 建立結果物件，將前三個加入
  let result = {};
  topThree.forEach(([name, value]) => (result[name] = value));

  // 將其他的總和加入
  result['其他'] = dataArray.slice(3).reduce((sum, [name, value]) => sum + value, 0);
  if(result['其他'] == 0){ //避免圓餅圖的[其他]顯示在畫面
    result = {};
  }
  // console.log('result:',result);
  // console.log("result['其他']",result['其他']);
  chartData2 = Object.entries(result);
  // console.log(chartData2);

  let chart2 = c3.generate({
    bindto: '#chart2', // HTML 元素綁定
    data: {
        type: "pie",
        columns: chartData2,
        colors:{
            "Louvre 雙人床架":"#DACBFF",
            "Antony 雙人床架":"#9D7FEA",
            "Anty 雙人床架": "#5434A7",
            "其他": "#301E5F",
        }
    },
  });

}


/** tBody列表綁定click事件, 判斷點擊[訂單狀態]或[刪除] */
tBody.addEventListener('click',function(e){
  //取消a標籤預設行為
  e.preventDefault(); 

  if(e.target.nodeName == 'A'){ 
    let orderId = e.target.getAttribute('data-id');
    let orderState = e.target.getAttribute('data-state');
    let newState = (orderState == 'false') ? true : false;
    // console.log('newState:',newState);
    changeStatus(orderId, newState);
  }
  if(e.target.nodeName == 'INPUT'){ 
    let orderId = e.target.getAttribute('data-id');
    // console.log(orderId);
    deleteOrder(orderId);
  }
});

/**變更訂單狀態 */
function changeStatus(orderId, newState){
  let param = {
    data:{
      id:orderId,
      paid:newState,
    }
  }
  
  axios.put(`${baseUrl}${apiPath}/orders`,param, token)
      .then(res=>{
        orderList = res.data.orders;
        renderData();
      });
}

/**刪除單筆訂單 */
function deleteOrder(orderId){
  axios.delete(`${baseUrl}${apiPath}/orders/${orderId}`, token)
      .then(res=>{
        orderList = res.data.orders;
        renderData();
      });
}

/** 刪除全部 */
discardAllBtn.addEventListener('click',function(e){
  e.preventDefault();

  console.log(e.target);
  axios.delete(`${baseUrl}${apiPath}/orders`,token)
      .then(res=>{
        orderList = res.data.orders;
        renderData();
      });
})





