var cart = {
    // (A) PROPERTIES
    hPdt : null,      // html products list
    hItems : null,    // html current cart
    items : {},       // current items in cart
    iURL : "images/", // product image url folder
    currency : "$",   // currency symbol
    total : 0,        // total amount
  
    // (B) LOCALSTORAGE CART
    // (B1) SAVE CURRENT CART INTO LOCALSTORAGE
    save : () => localStorage.setItem("cart", JSON.stringify(cart.items)),
  
    // (B2) LOAD CART FROM LOCALSTORAGE
    load : () => {
      cart.items = localStorage.getItem("cart");
      if (cart.items == null) { cart.items = {}; }
      else { cart.items = JSON.parse(cart.items); }
    },
  
    // (B3) EMPTY ENTIRE CART
    nuke : () => { if (confirm("Empty cart?")) {
      cart.items = {};
      localStorage.removeItem("cart");
      cart.list();
    }},
  
    // (C) INITIALIZE
    init : () => {
      // (C1) GET HTML ELEMENTS
      cart.hPdt = document.getElementById("cart-products");
      cart.hItems = document.getElementById("cart-items");
  
      // (C2) DRAW PRODUCTS LIST
      cart.hPdt.innerHTML = "";
      let template = document.getElementById("template-product").content, p, item;
      for (let id in products) {
        p = products[id];
        item = template.cloneNode(true);
        item.querySelector(".p-img").src = cart.iURL + p.img;
        item.querySelector(".p-name").textContent = p.name;
        item.querySelector(".p-price").textContent = cart.currency + p.price.toFixed(2);
        item.querySelector(".p-add").onclick = () => cart.add(id);
        cart.hPdt.appendChild(item);
      }
  
      // (C3) LOAD CART FROM PREVIOUS SESSION
      cart.load();
  
      // (C4) LIST CURRENT CART ITEMS
      cart.list();
    },
  
    // (D) LIST CURRENT CART ITEMS (IN HTML)
    list : () => {
      // (D1) RESET
      cart.total = 0;
      cart.hItems.innerHTML = "";
      let item, empty = true;
      for (let key in cart.items) {
        if (cart.items.hasOwnProperty(key)) { empty = false; break; }
      }
  
      // (D2) CART IS EMPTY
      if (empty) {
        item = document.createElement("div");
        item.innerHTML = "Cart is empty";
        cart.hItems.appendChild(item);
      }
  
      // (D3) CART IS NOT EMPTY - LIST ITEMS
      else {
        let template = document.getElementById("template-cart").content, p;
        for (let id in cart.items) {
          p = products[id];
          item = template.cloneNode(true);
          item.querySelector(".c-del").onclick = () => cart.remove(id);
          item.querySelector(".c-name").textContent = p.name;
          item.querySelector(".c-qty").value = cart.items[id];
          item.querySelector(".c-qty").onchange = function () { cart.change(id, this.value); };
          cart.hItems.appendChild(item);
          cart.total += cart.items[id] * p.price;
        }
  
        // (D3-3) TOTAL AMOUNT
        item = document.createElement("div");
        item.className = "c-total";
        item.id = "c-total";
        item.innerHTML = `TOTAL: ${cart.currency}${cart.total}`;
        cart.hItems.appendChild(item);
  
        // (D3-4) EMPTY & CHECKOUT
        item = document.getElementById("template-cart-checkout").content.cloneNode(true);
        cart.hItems.appendChild(item);
      }
    },
  
    // (E) ADD ITEM INTO CART
    add : id => {
      if (cart.items[id] == undefined) { cart.items[id] = 1; }
      else { cart.items[id]++; }
      cart.save(); cart.list();
    },
  
    // (F) CHANGE QUANTITY
    change : (pid, qty) => {
      // (F1) REMOVE ITEM
      if (qty <= 0) {
        delete cart.items[pid];
        cart.save(); cart.list();
      }
  
      // (F2) UPDATE TOTAL ONLY
      else {
        cart.items[pid] = qty;
        cart.total = 0;
        for (let id in cart.items) {
          cart.total += cart.items[id] * products[id].price;
          document.getElementById("c-total").innerHTML = `TOTAL: ${cart.currency}${cart.total}`;
        }
      }
    },
  
    // (G) REMOVE ITEM FROM CART
    remove : id => {
      delete cart.items[id];
      cart.save();
      cart.list();
    },
  
    // (H) CHECKOUT
    checkout : () => {
      // SEND DATA TO SERVER
      // CHECKS
      // SEND AN EMAIL
      // RECORD TO DATABASE
      // PAYMENT
      // WHATEVER IS REQUIRED
      alert("TO DO");
  
      /*
      var data = new FormData();
      data.append("cart", JSON.stringify(cart.items));
      data.append("products", JSON.stringify(products));
      data.append("total", cart.total);
      fetch("SERVER-SCRIPT", { method:"POST", body:data })
      .then(res=>res.text())
      .then(res => console.log(res))
      .catch(err => console.error(err));
      */
    }
  };
  window.addEventListener("DOMContentLoaded", cart.init);