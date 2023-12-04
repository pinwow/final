// 步驟一：初始化，取得產品與購物車列表
// 步驟二：新增購物車品項，並再次初始化購物車列表
// 步驟三：修改購物車狀態(刪除全部、刪除單筆)，並再次初始化購物車列表
// 步驟四：送出購買訂單，並再次初始化購物車列表
// 步驟五：觀看後台訂單
const baseUrl = 'https://livejs-api.hexschool.io/api/livejs/v1/customer/';
const apiPath = 'finproj';

// dom obj
const list = document.querySelector('.productWrap');
const cartTable = document.querySelector('.shoppingCart-table');
const submit = document.querySelector('.orderInfo-btn');
const customerName = document.querySelector('#customerName');
const customerPhone = document.querySelector('#customerPhone');
const customerEmail = document.querySelector('#customerEmail');
const customerAddress = document.querySelector('#customerAddress');
const tradeWay = document.querySelector('#tradeWay'); //付款方式
const form = document.querySelector('.orderInfo-form');

let productList = [];
let cartObj = {};
let cartList = [];
const rules = {
  姓名:{
    presence:{
      message: "必填!",
      // length: { minimum: 20 }, // 至少
    },
  },
  電話:{
    presence:{
      message: "必填!",
    },
  },
  Email:{
    presence:{
      message: "必填!"
    },
  },
  寄送地址:{
    presence:{
      message: "必填!",
    },
  },
}

/**
 * 頁面初始化: 顯示產品清單, 顯示購物車清單
 * 購物車清單會是空陣列[](因為一開始還沒加東西到購物車)
 */
init();

function init(){
  axios.get(`${baseUrl}${apiPath}/products`)
      .then(res=>{
        productList = res.data.products;
          renderProduct();
  });

  axios.get(`${baseUrl}${apiPath}/carts`)
      .then(res=>{
        cartObj = res.data;
        cartList = res.data.carts;
        renderCart();
      });
}

function renderProduct(){
  let str = '';
  productList.forEach((item)=>{
    /** 自定義data-prodId屬性值綁product id */
    str = str + `<li class="productCard">
                  <h4 class="productType">新品</h4>
                  <img src="${item.images}" alt="">
                  <a class="addCardBtn" data-prodId=${item.id}>加入購物車</a>
                  <h3>${item.title}</h3>
                  <del class="originPrice">NT$${item.origin_price}</del>
                  <p class="nowPrice">NT$${item.price}</p>
                </li>`;
    
  });
  list.innerHTML = str;
}

function renderCart(){
  let itemStr = '';
  let end = '';
  let start = `<tr>
                <th width="40%">品項</th>
                <th width="15%">單價</th>
                <th width="15%">數量</th>
                <th width="15%">金額</th>
                <th width="15%"></th>
              </tr>`;
  // console.log(cartList);

  if(cartList && cartList.length > 0){ //確保cartList存在 => undefined .length會噴錯
    cartList.forEach((item)=>{
      // console.log(item); //購物車 id
      itemStr = itemStr + `<tr>
                            <td>
                              <div class="cardItem-title">
                                <img src="${item.product.images}" alt="">
                                <p>${item.product.title}</p>
                              </div>
                            </td>
                            <td>NT$${item.product.price}</td>
                            <td>${item.quantity}</td>
                            <td>NT$${item.product.price}</td>
                            <td class="discardBtn">
                              <a class="material-icons" data-cartId=${item.id}>
                                clear
                              </a>
                            </td>
                          </tr>`;
    });
  }

  if(cartList && cartList.length > 0){ //確保cartList存在 => undefined .length會噴錯
    /** 購物車為空, 不顯示[刪除所有品項]按鈕 */
    end = `<tr>
            <td>
              <a class="discardAllBtn">刪除所有品項</a>
            </td>
            <td></td>
            <td></td>
            <td>
              <p>總金額</p>
            </td>
            <td>NT$${cartObj.finalTotal}</td>
          </tr>`;
  }else{
    end = ``;
  }

  cartTable.innerHTML = start + itemStr + end;

  /** 清空購物車 */
  const deleteAllBtn = document.querySelector('.discardAllBtn');
  if(deleteAllBtn){
    deleteAllBtn.addEventListener('click',function(e){
      if(e.target.getAttribute('class') == 'discardAllBtn'){
        axios.delete(`${baseUrl}${apiPath}/carts`)
            .then(res=>{
              cartObj = res.data;
              cartList = res.data.carts;
              renderCart();
            })
      }
    });
  }
}

// 產品清單 綁定 click event
// 加入購物車, 傳product id
// 因為一開始並不會有加入購物車這個按鈕, 所以click event要綁在list, 一開始就有list dom obj了！！
list.addEventListener('click',function(e){
  if(e.target.nodeName == 'A'){
    const productId = e.target.getAttribute('data-prodId');

    if(cartList == undefined){
      cartList = [];
    }

    if(cartList.length == 0){ //購物車為空
      addToCart(productId);
    }else{
      // console.log('購物車不為空');
      const sameItem = cartList.find(item=>{
        return item.product.id == productId;
      })

      if(sameItem){
        updateQuantity(sameItem);
      }else{
        addToCart(productId);
      }
    }
    
    

  }
})

/** 加入購物車 */
function addToCart(productId){
  // console.log('新增資料');
  let param = {
    data:{
      productId,
      quantity:1,
    }
  }
  // console.log(param);

  axios.post(`${baseUrl}${apiPath}/carts`,param)
      .then(res=>{
        cartObj = res.data;
        cartList = res.data.carts;
        renderCart();
  });
  
}

/** 更新單筆購物車商品的數量 */
function updateQuantity(item){
  // let newQuantity = item.quantity++;
  let param = {
    data:{
      id:item.id,
      quantity: item.quantity+1,
    }
  }
  axios.patch(`${baseUrl}${apiPath}/carts`,param)
      .then(res=>{
        cartObj = res.data;
        cartList = res.data.carts;
        renderCart();
      }); 
}

// 刪除單筆購物車品項(刪除一筆cart object): 刪除cartList中的一筆cart obj {}, 所以要傳cart id
cartTable.addEventListener('click',function(e){
  if(e.target.nodeName == 'A'){
    const cartId = e.target.getAttribute('data-cartId');
    axios.delete(`${baseUrl}${apiPath}/carts/${cartId}`)
        .then(res=>{
          cartObj = res.data;
          cartList = res.data.carts;
          renderCart();

    });
  }
});

/** 送出訂單*/
submit.addEventListener('click',function(e){
  e.preventDefault(); //防止頁面重整
  
  const errors = validate(form, rules);
  if(errors){ //檢核不通過
    const names = Object.keys(errors);  //拿到表單元素name屬性值 => ['姓名', '電話', 'Email', '寄送地址']
    names.forEach((name,index)=>{
      const errorMsg = errors[name][0].trim();
      const element = document.querySelector(`[name=${name}]`); //找出檢核未通過的dom obj
      const nextElement = element.nextElementSibling;
      nextElement.textContent = errorMsg;
    });
    return;
  }

  /** 購物車清單不可為空 */
  if(cartList == undefined){
    cartList = [];
  }
  if(cartList && cartList.length == 0){
    alert('請確認購物車內已有加入產品！');
    return;
  }

  let param = {
    data:{
      user:{
        name: customerName.value,
        tel: customerPhone.value,
        email: customerEmail.value,
        address: customerAddress.value,
        payment: tradeWay.value,
      }
    }
  }

  axios.post(`${baseUrl}${apiPath}/orders`,param)
      .then(res =>{
        alert('訂單送出成功!');

        //reset form and cartList
        cartObj = {};
        cartList = [];
        renderCart();
        
        customerName.value = '';
        customerAddress.value = '';
        customerEmail.value = '';
        customerPhone.value = '';
        tradeWay.value = 'ATM';
      })
      .catch(error =>{
        console.log(error.response.message);
      });
})

